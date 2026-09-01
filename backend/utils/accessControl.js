import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Evaluates whether a student (userId) has access to a specific quiz (testId).
 * 
 * Access Modes:
 * 1. FREE: Available to any logged-in student immediately -> ALLOWED
 * 2. PAID: Standalone paid test. Requires direct QuizPurchase OR enrollment in attached course -> ALLOWED
 * 3. COURSE_ONLY: Included in a course. Requires student to be enrolled in an attached course -> ALLOWED
 * 
 * Override: Admin users always have access.
 */
export async function verifyQuizAccessPermission(userId, testId, userRole = 'STUDENT') {
  if (userRole === 'ADMIN') {
    return { hasAccess: true, reason: 'ADMIN_OVERRIDE' };
  }

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      courseQuizzes: { select: { courseId: true } }
    }
  });

  if (!test) {
    return { hasAccess: false, reason: 'NOT_FOUND' };
  }

  // Rule 1: FREE access mode
  if (test.accessMode === 'FREE') {
    return { hasAccess: true, reason: 'FREE_TEST', test };
  }

  if (!userId) {
    return { hasAccess: false, reason: 'LOGIN_REQUIRED', test };
  }

  // Rule 2: Direct Quiz Purchase for standalone paid test
  if (test.accessMode === 'PAID') {
    const directPurchase = await prisma.quizPurchase.findFirst({
      where: {
        userId,
        testId,
        paymentStatus: 'SUCCESS'
      }
    });

    if (directPurchase) {
      return { hasAccess: true, reason: 'QUIZ_PURCHASED', test };
    }
  }

  // Rule 3: Included with an enrolled course
  const attachedCourseIds = test.courseQuizzes.map(cq => cq.courseId);
  if (test.courseId) {
    attachedCourseIds.push(test.courseId);
  }

  if (attachedCourseIds.length > 0) {
    const courseEnrollment = await prisma.purchase.findFirst({
      where: {
        userId,
        courseId: { in: attachedCourseIds },
        paymentStatus: 'SUCCESS'
      }
    });

    if (courseEnrollment) {
      return { hasAccess: true, reason: 'COURSE_ENROLLED', test, courseId: courseEnrollment.courseId };
    }
  }

  return {
    hasAccess: false,
    reason: 'PAYMENT_REQUIRED',
    test: {
      id: test.id,
      title: test.title,
      accessMode: test.accessMode,
      price: test.price,
      durationMinutes: test.durationMinutes,
      totalMarks: test.totalMarks
    }
  };
}
