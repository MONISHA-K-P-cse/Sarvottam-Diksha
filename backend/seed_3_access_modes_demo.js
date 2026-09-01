import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedThreeAccessModeQuizzes() {
  console.log('🚀 Seeding 3 Sample Quizzes covering all 3 Publication Access Modes...');

  try {
    // 1. Create or Find Sample Course
    let course = await prisma.course.findFirst({
      where: { title: 'Class 10 Mathematics Master Batch 2026' }
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          title: 'Class 10 Mathematics Master Batch 2026',
          description: 'Comprehensive Board Exam Preparation with Live Doubts, Practice Tests, and Formula Handbooks.',
          price: 1499,
          originalPrice: 2999,
          subject: 'Mathematics',
          category: 'Class 10',
          isPublished: true,
          thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80'
        }
      });
    }

    console.log(`🟢 Course Ready: ID=${course.id}, Title="${course.title}"`);

    // -------------------------------------------------------------
    // MODE 1: FREE QUIZ
    // -------------------------------------------------------------
    const freeQuiz = await prisma.test.create({
      data: {
        title: '🎁 Sample Free Quiz: Quadratic Equations & Trigonometry',
        durationMinutes: 20,
        totalMarks: 30,
        accessMode: 'FREE',
        price: 0,
        isPublished: true,
        questions: {
          create: [
            {
              questionType: 'MCQ',
              questionText: 'What is the discriminant of the quadratic equation 2x² - 4x + 3 = 0?',
              optionA: '-8',
              optionB: '8',
              optionC: '16',
              optionD: '-16',
              correctOption: 'A',
              marks: 4,
              negativeMarks: 1,
              explanation: 'D = b² - 4ac = (-4)² - 4(2)(3) = 16 - 24 = -8.'
            },
            {
              questionType: 'TRUE_FALSE',
              questionText: 'The identity sin²θ + cos²θ = 1 holds true for all real values of θ.',
              optionA: 'True',
              optionB: 'False',
              correctOption: 'A',
              marks: 4,
              negativeMarks: 0,
              explanation: 'By standard Pythagorean identity, sin²θ + cos²θ = 1 for all real angles θ.'
            },
            {
              questionType: 'TYPING',
              questionText: 'If tan θ = 1 (where 0° < θ < 90°), what is the value of θ in degrees?',
              correctOption: '45',
              marks: 4,
              negativeMarks: 0,
              explanation: 'tan(45°) = 1, so θ = 45.'
            }
          ]
        }
      }
    });
    console.log(`🟢 MODE 1 (FREE QUIZ) Created: ID=${freeQuiz.id}, Title="${freeQuiz.title}"`);

    // -------------------------------------------------------------
    // MODE 2: PAID STANDALONE QUIZ
    // -------------------------------------------------------------
    const paidQuiz = await prisma.test.create({
      data: {
        title: '💳 Sample Paid Standalone Test: Full Syllabus Grand Mock Test 2026',
        durationMinutes: 45,
        totalMarks: 50,
        accessMode: 'PAID',
        price: 199,
        isPublished: true,
        questions: {
          create: [
            {
              questionType: 'MCQ',
              questionText: 'The roots of the equation x² - 5x + 6 = 0 are:',
              optionA: '2 and 3',
              optionB: '-2 and -3',
              optionC: '1 and 6',
              optionD: '-1 and 6',
              correctOption: 'A',
              marks: 5,
              negativeMarks: 1,
              explanation: '(x-2)(x-3) = 0 => x = 2, 3.'
            },
            {
              questionType: 'TYPING',
              questionText: 'The sum of roots of a quadratic equation ax² + bx + c = 0 is equal to (-b/a). Type -b/a:',
              correctOption: '-b/a',
              marks: 5,
              negativeMarks: 0,
              explanation: 'Sum of roots α + β = -b/a.'
            }
          ]
        }
      }
    });
    console.log(`🟢 MODE 2 (PAID STANDALONE ₹199) Created: ID=${paidQuiz.id}, Title="${paidQuiz.title}"`);

    // -------------------------------------------------------------
    // MODE 3: ATTACHED TO COURSE
    // -------------------------------------------------------------
    const courseQuiz = await prisma.test.create({
      data: {
        title: '🎓 Sample Course Quiz: Chapter 1 & 2 Revision Test',
        durationMinutes: 30,
        totalMarks: 40,
        accessMode: 'COURSE_ONLY',
        price: 0,
        isPublished: true,
        courseId: course.id,
        questions: {
          create: [
            {
              questionType: 'MCQ',
              questionText: 'If HCF(306, 657) = 9, find LCM(306, 657):',
              optionA: '22338',
              optionB: '22388',
              optionC: '22833',
              optionD: '23238',
              correctOption: 'A',
              marks: 5,
              negativeMarks: 1,
              explanation: 'LCM × HCF = Product of two numbers => LCM = (306 × 657) / 9 = 22338.'
            }
          ]
        }
      }
    });

    // Attach to Course via CourseQuiz N:M join table
    await prisma.courseQuiz.create({
      data: {
        courseId: course.id,
        testId: courseQuiz.id,
        order: 1
      }
    });

    console.log(`🟢 MODE 3 (ATTACHED TO COURSE) Created: ID=${courseQuiz.id}, Title="${courseQuiz.title}"`);

    console.log('\n=============================================================');
    console.log('🎉 ALL 3 QUIZ PUBLICATION ACCESS MODES SEEDED SUCCESSFULLY!');
    console.log('=============================================================');

  } catch (err) {
    console.error('❌ Seeding Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedThreeAccessModeQuizzes();
