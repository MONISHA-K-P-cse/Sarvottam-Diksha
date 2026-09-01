import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// List all published courses for Student Portal & Store
router.get('/', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { status: 'PUBLISHED' },
          { isPublished: true, status: { notIn: ['DRAFT', 'UNPUBLISHED', 'ARCHIVED'] } }
        ]
      },
      include: {
        chapters: {
          include: {
            contents: { select: { id: true, type: true } },
            tests: { select: { id: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedCourses = courses.map(course => {
      let totalVideos = 0;
      let totalPdfs = 0;
      let totalTests = 0;

      course.chapters.forEach(ch => {
        ch.contents.forEach(cnt => {
          if (cnt.type === 'VIDEO') totalVideos++;
          if (cnt.type === 'PDF' || cnt.type === 'NOTES') totalPdfs++;
        });
        totalTests += ch.tests.length;
      });

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        price: course.price,
        originalPrice: course.originalPrice,
        validityDays: course.validityDays,
        thumbnail: course.thumbnail,
        totalChapters: course.chapters.length,
        totalVideos,
        totalPdfs,
        totalTests,
        createdAt: course.createdAt
      };
    });

    res.json({ success: true, courses: formattedCourses });
  } catch (error) {
    console.error('Fetch Courses Error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve courses.' });
  }
});

// Fetch Active Public Banners for Home Page or Student Portal
router.get('/public-banners', async (req, res) => {
  try {
    const { placement } = req.query; // 'HOME_PAGE' | 'STUDENT_PORTAL'
    let whereClause = { status: 'PUBLISHED' };

    if (placement) {
      whereClause.OR = [
        { targetPlacement: placement },
        { targetPlacement: 'BOTH' }
      ];
    }

    let banners = await prisma.publicPortal.findMany({
      where: whereClause,
      orderBy: { displayOrder: 'asc' }
    });

    res.json({ success: true, banners });
  } catch (error) {
    console.error('Fetch Public Banners Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch banners.' });
  }
});

// Get user's enrolled / purchased courses
router.get('/my-courses', requireAuth, async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: {
        userId: req.user.id,
        paymentStatus: 'SUCCESS'
      },
      include: {
        course: {
          include: {
            chapters: {
              include: {
                contents: true,
                tests: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const myCourses = purchases.map(p => ({
      purchaseId: p.id,
      purchaseDate: p.createdAt,
      amountPaid: p.amount,
      course: p.course
    }));

    res.json({ success: true, myCourses });
  } catch (error) {
    console.error('Fetch My Courses Error:', error);
    res.status(500).json({ success: false, error: 'Failed to load enrolled courses.' });
  }
});

// Single course details
router.get('/:id', async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        chapters: {
          orderBy: { orderIndex: 'asc' },
          include: {
            contents: {
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                title: true,
                type: true,
                duration: true,
                isFreePreview: true,
                orderIndex: true
              }
            },
            tests: {
              where: { isPublished: true },
              select: {
                id: true,
                title: true,
                durationMinutes: true,
                totalMarks: true,
                passPercentage: true
              }
            }
          }
        },
        tests: {
          where: { isPublished: true, chapterId: null },
          select: {
            id: true,
            title: true,
            durationMinutes: true,
            totalMarks: true,
            passPercentage: true,
            accessMode: true,
            price: true
          }
        },
        courseQuizzes: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
                durationMinutes: true,
                totalMarks: true,
                passPercentage: true,
                accessMode: true,
                price: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found.' });
    }

    res.json({ success: true, course });
  } catch (error) {
    console.error('Fetch Single Course Error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve course details.' });
  }
});

// Check access & fetch media content url (Protected content guard)
router.get('/:courseId/content/:contentId', requireAuth, async (req, res) => {
  try {
    const { courseId, contentId } = req.params;

    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: { chapter: true }
    });

    if (!content) {
      return res.status(404).json({ success: false, error: 'Content item not found.' });
    }

    // Allow if free preview
    if (content.isFreePreview) {
      return res.json({ success: true, content });
    }

    // Otherwise check purchase
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: req.user.id,
        courseId: courseId,
        paymentStatus: 'SUCCESS'
      }
    });

    if (!purchase && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Content locked. Please purchase this course to access videos and study materials.'
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error('Fetch Content Stream Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch content stream.' });
  }
});

export default router;
