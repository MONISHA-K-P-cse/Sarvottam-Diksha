import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Enforce admin authorization on all subroutes
router.use(requireAuth, requireAdmin);

// ================= COURSE ↔ QUIZ RELATIONSHIPS & PUBLICATION =================

// Get attached quizzes for a course
router.get('/courses/:courseId/quizzes', async (req, res) => {
  try {
    const { courseId } = req.params;

    const courseQuizzes = await prisma.courseQuiz.findMany({
      where: { courseId },
      include: {
        test: {
          include: {
            questions: { select: { id: true } }
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    const quizzes = courseQuizzes.map(cq => ({
      ...cq.test,
      order: cq.order,
      questionCount: cq.test.questions.length
    }));

    res.json({ success: true, quizzes });
  } catch (error) {
    console.error('Fetch Course Quizzes Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch course quizzes.' });
  }
});

// Attach an existing quiz to a course
router.post('/courses/:courseId/attach-quiz', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { testId } = req.body;

    if (!testId) {
      return res.status(400).json({ success: false, error: 'testId is required.' });
    }

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      return res.status(404).json({ success: false, error: 'Test not found.' });
    }

    // Upsert CourseQuiz link
    const courseQuiz = await prisma.courseQuiz.upsert({
      where: { courseId_testId: { courseId, testId } },
      update: {},
      create: { courseId, testId }
    });

    res.json({ success: true, message: 'Quiz attached to course successfully.', courseQuiz });
  } catch (error) {
    console.error('Attach Quiz Error:', error);
    res.status(500).json({ success: false, error: 'Failed to attach quiz to course.' });
  }
});
router.post('/courses/:courseId/quizzes', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { testId } = req.body;
    if (!testId) return res.status(400).json({ success: false, error: 'testId is required.' });

    const courseQuiz = await prisma.courseQuiz.upsert({
      where: { courseId_testId: { courseId, testId } },
      update: {},
      create: { courseId, testId }
    });
    res.json({ success: true, message: 'Quiz attached to course.', courseQuiz });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Remove a quiz from a course (Deletes relationship, DOES NOT delete quiz record!)
router.post('/courses/:courseId/detach-quiz', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { testId } = req.body;

    await prisma.courseQuiz.deleteMany({
      where: { courseId, testId }
    });

    res.json({ success: true, message: 'Quiz detached from course.' });
  } catch (error) {
    console.error('Detach Quiz Error:', error);
    res.status(500).json({ success: false, error: 'Failed to detach quiz from course.' });
  }
});

// Update Quiz Publication Access Mode & Course Associations
router.post('/quizzes/:testId/publish-mode', async (req, res) => {
  try {
    const { testId } = req.params;
    const { accessMode, price, courseIds } = req.body;

    const updatedTest = await prisma.test.update({
      where: { id: testId },
      data: {
        accessMode: accessMode || 'FREE',
        price: Number(price || 0)
      }
    });

    if (Array.isArray(courseIds)) {
      // Sync CourseQuiz join table
      await prisma.courseQuiz.deleteMany({ where: { testId } });
      for (const courseId of courseIds) {
        if (courseId) {
          await prisma.courseQuiz.create({
            data: { courseId, testId }
          });
        }
      }
    }

    res.json({ success: true, message: 'Quiz publication access updated.', test: updatedTest });
  } catch (error) {
    console.error('Publish Mode Update Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update quiz publication mode.' });
  }
});

// Dashboard overview statistics
router.get('/stats', async (req, res) => {
  try {
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const totalCourses = await prisma.course.count();
    const totalPurchases = await prisma.purchase.count({ where: { paymentStatus: 'SUCCESS' } });

    const revenueResult = await prisma.purchase.aggregate({
      where: { paymentStatus: 'SUCCESS' },
      _sum: { amount: true }
    });

    const totalRevenue = revenueResult._sum.amount || 0;

    const recentPurchases = await prisma.purchase.findMany({
      where: { paymentStatus: 'SUCCESS' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        course: { select: { title: true } }
      }
    });

    const recentRegistrations = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, phone: true, createdAt: true }
    });

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalCourses,
        totalPurchases,
        totalRevenue,
        recentPurchases,
        recentRegistrations
      }
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate admin statistics.' });
  }
});

// Admin: Search ALL registered students by name, email, or mobile phone number
router.get('/students/search', async (req, res) => {
  try {
    const { q } = req.query;
    const query = (q || '').trim();

    let whereClause = { role: 'STUDENT' };
    if (query) {
      whereClause = {
        role: 'STUDENT',
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
          { phone: { contains: query } }
        ]
      };
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      take: 50,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    res.json({ success: true, students });
  } catch (error) {
    console.error('Search Students Error:', error);
    res.status(500).json({ success: false, error: 'Failed to search students.' });
  }
});

// Admin: Detailed Student Quiz & MCQ Test Analytics
router.get('/quiz-analytics', async (req, res) => {
  try {
    const attempts = await prisma.testAttempt.findMany({
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        test: {
          include: {
            course: { select: { title: true } },
            questions: true
          }
        },
        answers: {
          include: {
            question: true
          }
        }
      }
    });

    res.json({ success: true, attempts });
  } catch (error) {
    console.error('Fetch Quiz Analytics Error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve quiz analytics.' });
  }
});

// Admin: List all courses with search, category, and status filters
router.get('/courses', async (req, res) => {
  try {
    const { q, category, status } = req.query;
    let whereClause = {};

    if (q && q.trim()) {
      whereClause.title = { contains: q.trim() };
    }
    if (category && category !== 'ALL') {
      whereClause.category = { contains: category.trim() };
    }
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        chapters: true,
        tests: true
      }
    });

    res.json({ success: true, courses });
  } catch (error) {
    console.error('Fetch Admin Courses Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch admin courses.' });
  }
});

function resolveCourseThumbnail(title, category, thumbnail) {
  if (thumbnail && typeof thumbnail === 'string' && thumbnail.trim() !== '' && !thumbnail.includes('unsplash.com') && !thumbnail.startsWith('/courses/class-')) {
    return thumbnail.trim();
  }

  const fullText = `${title || ''} ${category || ''}`.toUpperCase();
  let classNum = '10';
  for (let g = 6; g <= 12; g++) {
    if (fullText.includes(`CLASS ${g}`) || fullText.includes(`CLASS-${g}`) || fullText.includes(`GRADE ${g}`)) {
      classNum = String(g);
      break;
    }
  }

  if (fullText.includes('PARIKSHA')) {
    return `/courses/pariksha-${classNum}.png`;
  }
  return `/courses/abhyaas-${classNum}.svg`;
}

// Admin: Create New Course (Supports DRAFT / PUBLISHED, isFree, custom thumbnail)
router.post('/courses', async (req, res) => {
  try {
    const { 
      title, description, category, subject, price, originalPrice, 
      isFree, status, validityDays, thumbnail, gstAmount, handlingFee, platformFee 
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Course title is required.' });
    }

    const isCourseFree = Boolean(isFree || Number(price) === 0);
    const finalPrice = isCourseFree ? 0 : Number(price || 0);

    const finalThumbnail = resolveCourseThumbnail(title, category, thumbnail);

    const course = await prisma.course.create({
      data: {
        title,
        description: description || '',
        category: category || 'Class 10 Mathematics',
        subject: subject || 'Mathematics',
        price: finalPrice,
        originalPrice: originalPrice ? Number(originalPrice) : null,
        isFree: isCourseFree,
        status: status || 'PUBLISHED',
        isPublished: status === 'PUBLISHED',
        gstAmount: gstAmount ? Number(gstAmount) : Math.round(finalPrice * 0.18),
        handlingFee: handlingFee ? Number(handlingFee) : 14,
        platformFee: platformFee ? Number(platformFee) : 10,
        validityDays: validityDays ? Number(validityDays) : 365,
        thumbnail: finalThumbnail
      }
    });

    res.json({ success: true, course });
  } catch (error) {
    console.error('Create Course Error:', error);
    res.status(500).json({ success: false, error: 'Failed to create course.' });
  }
});

// Admin: Update Course
router.put('/courses/:id', async (req, res) => {
  try {
    const { 
      title, description, category, subject, price, originalPrice, 
      isFree, status, validityDays, thumbnail, gstAmount, handlingFee, platformFee 
    } = req.body;

    const isCourseFree = isFree !== undefined ? Boolean(isFree) : (price === 0);

    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        category,
        subject,
        price: price !== undefined ? (isCourseFree ? 0 : Number(price)) : undefined,
        originalPrice: originalPrice !== undefined ? (originalPrice ? Number(originalPrice) : null) : undefined,
        isFree: isCourseFree,
        status: status || undefined,
        isPublished: status ? (status === 'PUBLISHED') : undefined,
        validityDays: validityDays !== undefined ? Number(validityDays) : undefined,
        thumbnail: thumbnail !== undefined ? resolveCourseThumbnail(title, category, thumbnail) : undefined
      }
    });

    res.json({ success: true, course });
  } catch (error) {
    console.error('Update Course Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update course details.' });
  }
});

// Admin: Toggle Publication Status (DRAFT, PUBLISHED, UNPUBLISHED, ARCHIVED)
router.patch('/courses/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'Status is required.' });

    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        status,
        isPublished: status === 'PUBLISHED'
      }
    });

    res.json({ success: true, course });
  } catch (error) {
    console.error('Update Course Status Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update course status.' });
  }
});

// Admin: Soft Delete / Archive Course
router.delete('/courses/:id', async (req, res) => {
  try {
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: { status: 'ARCHIVED', isPublished: false }
    });
    res.json({ success: true, message: 'Course archived successfully.', course });
  } catch (error) {
    console.error('Archive Course Error:', error);
    res.status(500).json({ success: false, error: 'Failed to archive course.' });
  }
});
// Admin: Get Full Course Details for Management Modal
router.get('/courses/:id/full', async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        chapters: {
          orderBy: { orderIndex: 'asc' },
          include: {
            contents: { orderBy: { orderIndex: 'asc' } },
            tests: true
          }
        },
        tests: true,
        purchases: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found.' });
    }

    res.json({ success: true, course });
  } catch (error) {
    console.error('Fetch Full Admin Course Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch course details.' });
  }
});

// ==================================================
// PUBLIC PORTAL / WEBSITE MANAGEMENT ENDPOINTS
// ==================================================

// Admin: List all public portal content items (seeds existing banners if empty)
router.get('/public-portals', async (req, res) => {
  try {
    let portals = await prisma.publicPortal.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    if (portals.length === 0) {
      await prisma.publicPortal.createMany({
        data: [
          {
            title: 'Sarvottam Diksha Maths Coaching Special Batch Banner',
            description: 'Individual focus, chapterwise assessment, concept building batch by Manika Ma\'am',
            thumbnail: '/assets/poster-flyer.png',
            buttonText: 'Explore Batch',
            link: '/store',
            targetPlacement: 'BOTH',
            displayOrder: 1,
            status: 'PUBLISHED'
          },
          {
            title: 'ABHYAAS Quick MCQ Test Series Banner',
            description: 'Practice chapterwise MCQs and rank top on the student leaderboard',
            thumbnail: '/assets/poster-banner.png',
            buttonText: 'Start MCQ Test',
            link: '/free-test',
            targetPlacement: 'STUDENT_PORTAL',
            displayOrder: 2,
            status: 'PUBLISHED'
          },
          {
            title: 'CBSE 10th & 12th Board Results 2025 Showcase',
            description: 'Celebrating 100/100 top rankers in CBSE Mathematics',
            thumbnail: '/assets/results-2025.jpg',
            buttonText: 'View Rankers',
            link: '/leaderboard',
            targetPlacement: 'HOME_PAGE',
            displayOrder: 3,
            status: 'PUBLISHED'
          },
          {
            title: 'CBSE Board Results 2024 Toppers Banner',
            description: 'Outstanding performance by Sarvottam Diksha students',
            thumbnail: '/assets/results-2024.png',
            buttonText: 'View Results',
            link: '/leaderboard',
            targetPlacement: 'HOME_PAGE',
            displayOrder: 4,
            status: 'PUBLISHED'
          }
        ]
      });
      portals = await prisma.publicPortal.findMany({ orderBy: { displayOrder: 'asc' } });
    }

    res.json({ success: true, portals });
  } catch (error) {
    console.error('Fetch Public Portals Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch public portals.' });
  }
});

// Admin: Create Public Portal / Content Banner Item
router.post('/public-portals', async (req, res) => {
  try {
    const { title, description, thumbnail, buttonText, link, targetPlacement, displayOrder, status } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Title is required.' });

    const portal = await prisma.publicPortal.create({
      data: {
        title,
        description: description || '',
        thumbnail: thumbnail || null,
        buttonText: buttonText || 'Explore Now',
        link: link || '/store',
        targetPlacement: targetPlacement || 'BOTH',
        displayOrder: displayOrder ? Number(displayOrder) : 0,
        status: status || 'PUBLISHED'
      }
    });

    res.json({ success: true, portal });
  } catch (error) {
    console.error('Create Public Portal Error:', error);
    res.status(500).json({ success: false, error: 'Failed to create public portal item.' });
  }
});

// Admin: Update Public Portal
router.put('/public-portals/:id', async (req, res) => {
  try {
    const { title, description, thumbnail, buttonText, link, displayOrder, status } = req.body;

    const portal = await prisma.publicPortal.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        thumbnail,
        buttonText,
        link,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : undefined,
        status
      }
    });

    res.json({ success: true, portal });
  } catch (error) {
    console.error('Update Public Portal Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update public portal.' });
  }
});

// Admin: Delete Public Portal Banner Item
router.delete('/public-portals/:id', async (req, res) => {
  try {
    await prisma.publicPortal.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Public portal deleted.' });
  } catch (error) {
    console.error('Delete Public Portal Error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete public portal.' });
  }
});

// Admin: Add Chapter to Course
router.post('/courses/:courseId/chapters', async (req, res) => {
  try {
    const { title, orderIndex } = req.body;
    const { courseId } = req.params;

    const chapter = await prisma.chapter.create({
      data: {
        courseId,
        title: title || 'New Chapter',
        orderIndex: orderIndex ? Number(orderIndex) : 1
      }
    });

    res.json({ success: true, chapter });
  } catch (error) {
    console.error('Create Chapter Error:', error);
    res.status(500).json({ success: false, error: 'Failed to create chapter.' });
  }
});

// Admin: Add Video/PDF Content to Chapter
router.post('/chapters/:chapterId/content', async (req, res) => {
  try {
    const { title, type, url, duration, isFreePreview, orderIndex } = req.body;
    const { chapterId } = req.params;

    const content = await prisma.content.create({
      data: {
        chapterId,
        title,
        type: type || 'VIDEO',
        url,
        duration: duration || '',
        isFreePreview: Boolean(isFreePreview),
        orderIndex: orderIndex ? Number(orderIndex) : 1
      }
    });

    res.json({ success: true, content });
  } catch (error) {
    console.error('Create Content Error:', error);
    res.status(500).json({ success: false, error: 'Failed to add content item.' });
  }
});

// Admin: Get Full Course Details with Chapters, Tests, Questions, and Enrolled Student Attempts
router.get('/courses/:courseId/full', async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            contents: { orderBy: { orderIndex: 'asc' } }
          },
          orderBy: { orderIndex: 'asc' }
        },
        tests: {
          include: {
            questions: true,
            testAttempts: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true } }
              },
              orderBy: { submittedAt: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        purchases: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found.' });
    }

    res.json({ success: true, course });
  } catch (error) {
    console.error('Fetch Full Course Details Error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve full course details.' });
  }
});

// Admin: Get all created tests (Draft & Published)
router.get('/tests', async (req, res) => {
  try {
    const tests = await prisma.test.findMany({
      include: {
        course: { select: { id: true, title: true } },
        courseQuizzes: { select: { courseId: true, course: { select: { title: true } } } },
        questions: { select: { id: true, sectionName: true, questionType: true } },
        _count: { select: { attempts: true, questions: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, tests });
  } catch (error) {
    console.error('Fetch Admin Tests Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch admin tests.' });
  }
});

// Admin: Create Test Series (General or for a specific Course)
router.post('/tests', async (req, res) => {
  try {
    const { courseId, chapterId, title, durationMinutes, totalMarks, negativeMarks, passPercentage, solutionDocUrl, solutionDocName, accessMode, price, courseIds } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Test title is required.' });
    }

    const test = await prisma.test.create({
      data: {
        courseId: courseId || null,
        chapterId: chapterId || null,
        title,
        durationMinutes: Number(durationMinutes || 40),
        totalMarks: Number(totalMarks || 100),
        negativeMarks: Number(negativeMarks || 0.25),
        passPercentage: Number(passPercentage || 40.0),
        accessMode: accessMode || 'FREE',
        price: Number(price || 0),
        solutionDocUrl: solutionDocUrl || null,
        solutionDocName: solutionDocName || null,
        isPublished: true
      }
    });

    // Handle course attachments if specified
    const targetCourseIds = Array.isArray(courseIds) ? courseIds : (courseId ? [courseId] : []);
    for (const cId of targetCourseIds) {
      if (cId) {
        await prisma.courseQuiz.upsert({
          where: { courseId_testId: { courseId: cId, testId: test.id } },
          update: {},
          create: { courseId: cId, testId: test.id }
        });
      }
    }

    res.json({ success: true, test });
  } catch (error) {
    console.error('Create Test Error:', error);
    res.status(500).json({ success: false, error: 'Failed to create test.' });
  }
});

// Admin: Create Test Series for a specific Course
router.post('/courses/:courseId/tests', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { chapterId, title, durationMinutes, totalMarks, negativeMarks, passPercentage, solutionDocUrl, solutionDocName, accessMode, price } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Test title is required.' });
    }

    const test = await prisma.test.create({
      data: {
        courseId,
        chapterId: chapterId || null,
        title,
        durationMinutes: Number(durationMinutes || 40),
        totalMarks: Number(totalMarks || 100),
        negativeMarks: Number(negativeMarks || 0.25),
        passPercentage: Number(passPercentage || 40.0),
        accessMode: accessMode || 'COURSE_ONLY',
        price: Number(price || 0),
        solutionDocUrl: solutionDocUrl || null,
        solutionDocName: solutionDocName || null,
        isPublished: true
      }
    });

    await prisma.courseQuiz.upsert({
      where: { courseId_testId: { courseId, testId: test.id } },
      update: {},
      create: { courseId, testId: test.id }
    });

    res.json({ success: true, test });
  } catch (error) {
    console.error('Create Course Test Error:', error);
    res.status(500).json({ success: false, error: 'Failed to create test for course.' });
  }
});

// Admin: Add Question to Test
router.post('/tests/:testId/questions', async (req, res) => {
  try {
    const { sectionName, questionType, questionText, imageUrl, optionA, optionB, optionC, optionD, options, correctOption, explanation, marks, negativeMarks } = req.body;
    const { testId } = req.params;

    if (!questionText || !questionText.trim()) {
      return res.status(400).json({ success: false, error: 'Question text is required.' });
    }

    let optA = optionA || '';
    let optB = optionB || '';
    let optC = optionC || '';
    let optD = optionD || '';

    if (options) {
      let optsArr = [];
      if (Array.isArray(options)) {
        optsArr = options;
      } else if (typeof options === 'string') {
        try { optsArr = JSON.parse(options); } catch (e) {}
      }
      if (Array.isArray(optsArr) && optsArr.length > 0) {
        optA = optA || optsArr[0] || '';
        optB = optB || optsArr[1] || '';
        optC = optC || optsArr[2] || '';
        optD = optD || optsArr[3] || '';
      }
    }

    const question = await prisma.question.create({
      data: {
        testId,
        sectionName: sectionName || 'Section A',
        questionType: questionType || 'MCQ',
        questionText: questionText.trim(),
        imageUrl: imageUrl || null,
        optionA: optA,
        optionB: optB,
        optionC: optC,
        optionD: optD,
        correctOption: correctOption || (questionType === 'TYPING' ? '' : 'A'),
        explanation: explanation || '',
        marks: marks ? Number(marks) : 1.0,
        negativeMarks: negativeMarks ? Number(negativeMarks) : 0.0
      }
    });

    res.json({ success: true, question });
  } catch (error) {
    console.error('Add Question Error:', error);
    res.status(500).json({ success: false, error: 'Failed to add question.' });
  }
});

// Admin: Edit Question
router.put('/questions/:id', async (req, res) => {
  try {
    const { sectionName, questionType, questionText, imageUrl, optionA, optionB, optionC, optionD, correctOption, explanation, marks, negativeMarks } = req.body;
    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: {
        sectionName: sectionName || 'Section A',
        questionType: questionType || 'MCQ',
        questionText,
        imageUrl: imageUrl || null,
        optionA: optionA || '',
        optionB: optionB || '',
        optionC: optionC || '',
        optionD: optionD || '',
        correctOption,
        explanation,
        marks: marks ? Number(marks) : 1.0,
        negativeMarks: negativeMarks ? Number(negativeMarks) : 0.0
      }
    });

    res.json({ success: true, question });
  } catch (error) {
    console.error('Edit Question Error:', error);
    res.status(500).json({ success: false, error: 'Failed to edit question.' });
  }
});

// Admin: Delete Question
router.delete('/questions/:id', async (req, res) => {
  try {
    await prisma.question.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Question deleted.' });
  } catch (error) {
    console.error('Delete Question Error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete question.' });
  }
});

// Admin: Toggle Test Publication Status
router.patch('/tests/:id/status', async (req, res) => {
  try {
    const { isPublished } = req.body;
    const test = await prisma.test.update({
      where: { id: req.params.id },
      data: { isPublished: Boolean(isPublished) }
    });
    res.json({ success: true, test });
  } catch (error) {
    console.error('Toggle Test Status Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update test status.' });
  }
});

// Admin: Delete Test
router.delete('/tests/:id', async (req, res) => {
  try {
    await prisma.test.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Test deleted.' });
  } catch (error) {
    console.error('Delete Test Error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete test.' });
  }
});

// Admin: Get All Student Quiz Attempts with Full Details (Student Info, Answers, Solutions & Override Status)
router.get('/quiz-attempts', async (req, res) => {
  try {
    const { testId, userId } = req.query;
    let whereClause = {};
    if (testId) whereClause.testId = testId;
    if (userId) whereClause.userId = userId;

    const attempts = await prisma.testAttempt.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        test: { select: { id: true, title: true, passPercentage: true, durationMinutes: true, solutionDocUrl: true, solutionDocName: true } },
        answers: {
          include: {
            question: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({ success: true, attempts });
  } catch (error) {
    console.error('Fetch Admin Quiz Attempts Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch student quiz attempts.' });
  }
});

// Admin: Override Student Quiz Score, Fix Answer Corrections & Add Teacher Comments
router.put('/quiz-attempts/:attemptId/override', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { newScore, teacherComment, answerOverrides } = req.body;

    // Update answer level overrides if passed
    if (Array.isArray(answerOverrides)) {
      for (const ans of answerOverrides) {
        if (ans.answerId) {
          await prisma.testAttemptAnswer.update({
            where: { id: ans.answerId },
            data: {
              isCorrect: Boolean(ans.isCorrect),
              scoreEarned: ans.scoreEarned !== undefined ? Number(ans.scoreEarned) : undefined,
              isManualOverride: true
            }
          });
        }
      }
    }

    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        score: newScore !== undefined ? Number(newScore) : undefined,
        teacherComment: teacherComment !== undefined ? teacherComment : undefined,
        isManualOverride: true
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        test: { select: { id: true, title: true, passPercentage: true } },
        answers: {
          include: {
            question: true
          }
        }
      }
    });

    res.json({ success: true, attempt: updatedAttempt, message: 'Student attempt evaluated and score updated successfully!' });
  } catch (error) {
    console.error('Override Student Quiz Score Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update student quiz score and feedback.' });
  }
});

// Admin: Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        purchases: {
          where: { paymentStatus: 'SUCCESS' },
          include: { course: { select: { title: true } } }
        },
        testAttempts: {
          select: { id: true, score: true, maxScore: true, accuracyPercentage: true, timeTakenSeconds: true, submittedAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, students });
  } catch (error) {
    console.error('Fetch Students Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch student roster.' });
  }
});

// Admin: Manual Student Course Unlock (Enrollment)
router.post('/students/unlock-course', async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) {
      return res.status(400).json({ success: false, error: 'Student ID and Course ID are required.' });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found.' });
    }

    const existingPurchase = await prisma.purchase.findFirst({
      where: { userId: studentId, courseId, paymentStatus: 'SUCCESS' }
    });

    if (existingPurchase) {
      return res.json({ success: true, message: 'Student is already enrolled in this course.', purchase: existingPurchase });
    }

    const orderId = `ADMIN_UNLOCK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const purchase = await prisma.purchase.create({
      data: {
        userId: studentId,
        courseId,
        amount: course.price || 0,
        paymentGateway: 'MANUAL_ADMIN',
        paymentStatus: 'SUCCESS',
        orderId,
        paymentId: `ADMIN_${Date.now()}`
      }
    });

    res.json({ success: true, message: `Successfully enrolled student in ${course.title}!`, purchase });
  } catch (error) {
    console.error('Manual Unlock Error:', error);
    res.status(500).json({ success: false, error: 'Failed to unlock course for student.' });
  }
});

// Admin: Manage Coupons (CRUD)
router.get('/coupons', async (req, res) => {
  try {
    let coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    if (coupons.length === 0) {
      // Seed default coupons matching Classplus demo screenshot (TANUSH, EarlyBirdOffer, Early b Launch offer)
      await prisma.coupon.createMany({
        data: [
          { code: 'TANUSH', title: 'TANUSH Special Discount', discountType: 'FLAT', discountValue: 200, status: 'EXPIRED', usedCount: 0 },
          { code: 'FLAT200', title: 'EarlyBirdOffer', discountType: 'FLAT', discountValue: 200, status: 'EXPIRED', usedCount: 19 },
          { code: 'EARLYBIRD100', title: 'Early b Launch offer', discountType: 'FLAT', discountValue: 200, status: 'EXPIRED', usedCount: 3 },
          { code: 'WELCOME500', title: 'Welcome 500 Offer', discountType: 'FLAT', discountValue: 500, status: 'ACTIVE', usedCount: 12 }
        ]
      });
      coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    }
    res.json({ success: true, coupons });
  } catch (error) {
    console.error('Fetch Coupons Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch coupons.' });
  }
});

router.post('/coupons', async (req, res) => {
  try {
    const { code, title, discountType, discountValue, minOrderValue, maxUses, expiresAt, courseSelectionType, assignedCourseIds, status } = req.body;
    
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter a valid coupon code.' });
    }

    if (!discountValue || isNaN(discountValue) || Number(discountValue) <= 0) {
      return res.status(400).json({ success: false, error: 'Please enter a valid positive discount amount.' });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check if coupon code already exists
    const existing = await prisma.coupon.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return res.status(400).json({ success: false, error: `Coupon code '${cleanCode}' already exists. Please enter a unique code.` });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        title: title || `${cleanCode} Discount`,
        discountType: discountType || 'FLAT',
        discountValue: Number(discountValue),
        minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
        maxUses: maxUses !== undefined && maxUses !== null ? Number(maxUses) : null,
        courseSelectionType: courseSelectionType || 'ALL',
        assignedCourseIds: Array.isArray(assignedCourseIds) ? assignedCourseIds.join(',') : (assignedCourseIds || null),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: status || 'ACTIVE'
      }
    });

    res.json({ success: true, coupon });
  } catch (error) {
    console.error('Create Coupon Error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: `Coupon code already exists in database.` });
    }
    res.status(400).json({ success: false, error: error.message || 'Failed to create coupon due to database error.' });
  }
});

router.delete('/coupons/:id', async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (error) {
    console.error('Delete Coupon Error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete coupon.' });
  }
});

// Admin: Manage Live / Upcoming Classes
router.get('/classes', async (req, res) => {
  try {
    let classes = await prisma.liveClass.findMany({ orderBy: { startTime: 'asc' } });
    if (classes.length === 0) {
      // Seed default upcoming class
      await prisma.liveClass.create({
        data: {
          title: 'Class 10 CBSE Board Target 100/100 Live Session',
          subject: 'Mathematics',
          classGrade: 'Class 10',
          duration: '60 mins',
          status: 'UPCOMING'
        }
      });
      classes = await prisma.liveClass.findMany({ orderBy: { startTime: 'asc' } });
    }
    res.json({ success: true, classes });
  } catch (error) {
    console.error('Fetch Classes Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch live classes.' });
  }
});

router.post('/classes', async (req, res) => {
  try {
    const { title, subject, classGrade, duration } = req.body;
    const newClass = await prisma.liveClass.create({
      data: {
        title: title || 'Live Mathematics Doubt Session',
        subject: subject || 'Mathematics',
        classGrade: classGrade || 'Class 10',
        duration: duration || '60 mins',
        status: 'UPCOMING'
      }
    });
    res.json({ success: true, liveClass: newClass });
  } catch (error) {
    console.error('Create Class Error:', error);
    res.status(500).json({ success: false, error: 'Failed to schedule live class.' });
  }
});

// Admin: Manage Free Resources (Documents, Videos, Free Tests)
router.get('/free-resources', async (req, res) => {
  try {
    let resources = await prisma.freeResource.findMany({ orderBy: { createdAt: 'desc' } });
    if (resources.length === 0) {
      await prisma.freeResource.createMany({
        data: [
          { title: 'Class 10 Board Formula Sheet PDF', type: 'DOCUMENT', url: '/sample-formula.pdf', category: 'Formula Sheet', description: 'Complete Mathematics Formula Sheet for Class 10 CBSE' },
          { title: 'Quadratic Equations Concept Lecture', type: 'VIDEO', url: 'https://youtube.com/watch?v=sample', category: 'Video Lesson', description: 'Step by step explanation by Manika Ma\'am' },
          { title: 'Class 10 CBSE Chapterwise Test Paper', type: 'TEST', url: '/test/free-10', category: 'Free Test', description: 'Interactive MCQ practice test paper' }
        ]
      });
      resources = await prisma.freeResource.findMany({ orderBy: { createdAt: 'desc' } });
    }
    res.json({ success: true, resources });
  } catch (error) {
    console.error('Fetch Free Resources Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch free resources.' });
  }
});

router.post('/free-resources', async (req, res) => {
  try {
    const { title, type, url, category, description } = req.body;
    const resource = await prisma.freeResource.create({
      data: {
        title: title || 'New Free Study Material',
        type: type || 'DOCUMENT',
        url: url || 'https://drive.google.com',
        category: category || 'Formula Sheet',
        description: description || ''
      }
    });
    res.json({ success: true, resource });
  } catch (error) {
    console.error('Create Free Resource Error:', error);
    res.status(500).json({ success: false, error: 'Failed to create free study material.' });
  }
});

router.delete('/free-resources/:id', async (req, res) => {
  try {
    await prisma.freeResource.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Free resource deleted.' });
  } catch (error) {
    console.error('Delete Free Resource Error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete free resource.' });
  }
});

// Admin: Transactions List Dashboard
router.get('/transactions', async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        course: { select: { id: true, title: true, price: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalAmount = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    const avgOrderValue = purchases.length > 0 ? Math.round(totalAmount / purchases.length) : 0;

    res.json({
      success: true,
      transactions: purchases,
      stats: {
        count: purchases.length,
        totalAmount,
        avgOrderValue
      }
    });
  } catch (error) {
    console.error('Fetch Transactions Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions.' });
  }
});

// Admin: Export Report Generator (Supports all 12 report types)
router.post('/export-report', async (req, res) => {
  try {
    const { reportType } = req.body;
    let data = [];

    switch (reportType) {
      case 'Student Profile Data':
      case 'Student Multi Device Login':
      case 'Course Inactive students':
      case 'Revoked Students':
        data = await prisma.user.findMany({ where: { role: 'STUDENT' } });
        break;
      case 'Course Purchase Transaction Report':
      case 'Student Course Instalment Report':
      case 'Free Course Report':
        data = await prisma.purchase.findMany({ include: { user: true, course: true } });
        break;
      case 'AI Powered Leads':
        data = await prisma.user.findMany({ select: { name: true, email: true, phone: true, createdAt: true } });
        break;
      case 'Offline Material Shipment Address':
      case 'Delivery Tracking Report':
        data = await prisma.user.findMany({ select: { name: true, email: true, phone: true } });
        break;
      case 'SMS/Email Report':
        data = await prisma.notification.findMany();
        break;
      default:
        data = await prisma.user.findMany({ where: { role: 'STUDENT' } });
    }

    res.json({
      success: true,
      reportType: reportType || 'Student Profile Data',
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Export Report Error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report.' });
  }
});

// Admin: Update Branding Settings
router.put('/branding', async (req, res) => {
  try {
    const { appName, tagline, logoUrl, primaryColor, secondaryColor, contactEmail, contactPhone, address } = req.body;

    const settings = await prisma.brandingSettings.upsert({
      where: { id: 'default' },
      update: {
        appName,
        tagline,
        logoUrl,
        primaryColor,
        secondaryColor,
        contactEmail,
        contactPhone,
        address
      },
      create: {
        id: 'default',
        appName: appName || 'Sarvottam Diksha',
        tagline: tagline || 'Delve in concepts with MANIKA',
        logoUrl: logoUrl || '/logo.png',
        primaryColor: primaryColor || '#0284C7',
        secondaryColor: secondaryColor || '#EA580C',
        contactEmail: contactEmail || 'Dikshasarvottam@gmail.com',
        contactPhone: contactPhone || '+91 99646 77802',
        address: address || 'Sarvottam Diksha Learning Center'
      }
    });

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Update Branding Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update app branding settings.' });
  }
});

// Admin: Get all coupons
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, coupons });
  } catch (error) {
    console.error('Fetch Admin Coupons Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch coupons.' });
  }
});

// Admin: Create Coupon (supports code, title, discountType, discountValue, minOrderValue, maxUses, expiresAt)
router.post('/coupons', async (req, res) => {
  try {
    const { code, title, discountType, discountValue, minOrderValue, maxUses, expiresAt } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Coupon code is required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await prisma.coupon.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return res.status(400).json({ success: false, error: `Coupon code '${cleanCode}' already exists.` });
    }

    const parsedExpiry = expiresAt ? new Date(expiresAt) : null;

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        title: title || `${discountType === 'PERCENTAGE' ? `${discountValue}% OFF` : `Flat ₹${discountValue} OFF`}`,
        discountType: discountType || 'FLAT',
        discountValue: Number(discountValue || 0),
        minOrderValue: Number(minOrderValue || 0),
        maxUses: maxUses ? Number(maxUses) : 100,
        expiresAt: parsedExpiry,
        status: 'ACTIVE'
      }
    });

    res.json({ success: true, coupon });
  } catch (error) {
    console.error('Create Coupon Error:', error);
    res.status(500).json({ success: false, error: 'Failed to create coupon.' });
  }
});

// Admin: Delete Coupon
router.delete('/coupons/:id', async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (error) {
    console.error('Delete Coupon Error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete coupon.' });
  }
});

export default router;
