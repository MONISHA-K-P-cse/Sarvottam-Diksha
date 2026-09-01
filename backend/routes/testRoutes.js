import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/authMiddleware.js';
import { verifyQuizAccessPermission } from '../utils/accessControl.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get categorized public test catalog (Free, Purchased, Course-included, Locked/Paid)
router.get('/catalog/categorized', async (req, res) => {
  try {
    const userId = req.headers.authorization ? (req.user?.id || null) : null;
    let currentUserId = userId;

    // Optional auth token decode if header present
    if (req.headers.authorization && !currentUserId) {
      try {
        const jwt = await import('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'sarvottam_secret_2026');
        currentUserId = decoded.id;
      } catch (e) {}
    }

    const allTests = await prisma.test.findMany({
      where: { isPublished: true },
      include: {
        course: { select: { id: true, title: true } },
        courseQuizzes: { select: { courseId: true, course: { select: { title: true } } } },
        questions: { select: { id: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const freeTests = [];
    const purchasedTests = [];
    const courseTests = [];
    const lockedPaidTests = [];

    for (const test of allTests) {
      const questionCount = test.questions.length;
      const attachedCourses = test.courseQuizzes.map(cq => cq.course?.title).filter(Boolean);
      if (test.course?.title && !attachedCourses.includes(test.course.title)) {
        attachedCourses.push(test.course.title);
      }

      let isUnlocked = false;
      let accessReason = 'LOCKED';

      if (test.accessMode === 'FREE' || Number(test.price) === 0) {
        isUnlocked = true;
        accessReason = 'FREE_TEST';
      } else if (currentUserId) {
        const accessCheck = await verifyQuizAccessPermission(currentUserId, test.id, req.user?.role || 'STUDENT');
        isUnlocked = accessCheck.hasAccess;
        accessReason = accessCheck.reason;
      }

      const testDto = {
        id: test.id,
        title: test.title,
        accessMode: test.accessMode,
        price: test.price,
        durationMinutes: test.durationMinutes,
        totalMarks: test.totalMarks,
        questionCount,
        attachedCourses,
        isUnlocked,
        accessReason
      };

      if (test.accessMode === 'FREE' || Number(test.price) === 0) {
        freeTests.push(testDto);
      } else if (test.accessMode === 'PAID') {
        if (isUnlocked && accessReason === 'QUIZ_PURCHASED') {
          purchasedTests.push(testDto);
        } else if (isUnlocked && accessReason === 'COURSE_ENROLLED') {
          courseTests.push(testDto);
        } else {
          lockedPaidTests.push(testDto);
        }
      } else if (test.accessMode === 'COURSE_ONLY' || attachedCourses.length > 0) {
        if (isUnlocked) {
          courseTests.push(testDto);
        } else {
          lockedPaidTests.push(testDto);
        }
      } else {
        if (isUnlocked) freeTests.push(testDto);
        else lockedPaidTests.push(testDto);
      }
    }

    res.json({
      success: true,
      catalog: {
        freeTests,
        purchasedTests,
        courseTests,
        lockedPaidTests,
        allTestsCount: allTests.length
      }
    });
  } catch (error) {
    console.error('Categorized Test Catalog Error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve test catalog.' });
  }
});

// Get test details & questions (Protected by verifyQuizAccessPermission)
router.get('/:testId', requireAuth, async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const accessCheck = await verifyQuizAccessPermission(userId, testId, userRole);
    if (!accessCheck.hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: You must purchase this standalone test or enroll in its associated course to attempt it.',
        reason: accessCheck.reason,
        test: accessCheck.test
      });
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        course: { select: { title: true } },
        courseQuizzes: { include: { course: { select: { title: true } } } },
        questions: true
      }
    });

    if (!test) {
      return res.status(404).json({ success: false, error: 'Test series not found.' });
    }

    res.json({ success: true, test, accessReason: accessCheck.reason });
  } catch (error) {
    console.error('Fetch Test Error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve test.' });
  }
});

// Start or Resume Active Test Session (Server-backed timer persistence)
router.post('/:testId/start', requireAuth, async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.id;

    const accessCheck = await verifyQuizAccessPermission(userId, testId, req.user?.role);
    if (!accessCheck.hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: You must purchase this standalone test or enroll in its associated course to attempt it.'
      });
    }

    const test = await prisma.test.findUnique({
      where: { id: testId }
    });

    if (!test) {
      return res.status(404).json({ success: false, error: 'Test not found.' });
    }

    let session = await prisma.activeTestSession.findUnique({
      where: { userId_testId: { userId, testId } }
    });

    if (!session) {
      const startedAt = new Date();
      const durationMins = test.durationMinutes || 20;
      const expiresAt = new Date(startedAt.getTime() + durationMins * 60 * 1000);

      session = await prisma.activeTestSession.create({
        data: {
          userId,
          testId,
          startedAt,
          expiresAt,
          savedAnswers: '{}',
          savedFlagged: '{}'
        }
      });

      const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      return res.json({
        success: true,
        session: {
          startedAt: session.startedAt,
          expiresAt: session.expiresAt,
          remainingSeconds,
          expired: remainingSeconds <= 0,
          savedAnswers: {},
          savedFlagged: {}
        }
      });
    } else {
      const remainingSeconds = Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000);
      const isExpired = remainingSeconds <= 0;

      return res.json({
        success: true,
        session: {
          startedAt: session.startedAt,
          expiresAt: session.expiresAt,
          remainingSeconds: Math.max(0, remainingSeconds),
          expired: isExpired,
          savedAnswers: JSON.parse(session.savedAnswers || '{}'),
          savedFlagged: JSON.parse(session.savedFlagged || '{}')
        }
      });
    }
  } catch (error) {
    console.error('Start Test Session Error:', error);
    res.status(500).json({ success: false, error: 'Failed to start test session.' });
  }
});

// Save intermediate progress during active test
router.post('/:testId/save-progress', requireAuth, async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.id;
    const { userAnswers, flagged } = req.body;

    await prisma.activeTestSession.upsert({
      where: { userId_testId: { userId, testId } },
      update: {
        savedAnswers: JSON.stringify(userAnswers || {}),
        savedFlagged: JSON.stringify(flagged || {})
      },
      create: {
        userId,
        testId,
        expiresAt: new Date(Date.now() + 20 * 60 * 1000),
        savedAnswers: JSON.stringify(userAnswers || {}),
        savedFlagged: JSON.stringify(flagged || {})
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Save Progress Error:', error);
    res.status(500).json({ success: false, error: 'Failed to save progress.' });
  }
});

// Submit Test & Evaluate Score
router.post('/:testId/submit', requireAuth, async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.id;
    const { answers, userAnswers, timeTakenSeconds, questionTimes } = req.body;

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true, course: true }
    });

    if (!test) {
      return res.status(404).json({ success: false, error: 'Test not found.' });
    }

    let totalEarnedScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const timeSpentMap = questionTimes || {};

    const evaluatedAnswers = test.questions.map(q => {
      const userAnsObj = (answers && answers[q.id]) || {};
      const selectedOpt = userAnsObj.selectedOption || (userAnswers && typeof userAnswers[q.id] === 'string' ? userAnswers[q.id] : null);
      const typedAns = userAnsObj.typedAnswer || (userAnswers && typeof userAnswers[q.id] === 'string' ? userAnswers[q.id] : null);
      const qTimeSpent = timeSpentMap[q.id] || 0;

      let isCorrect = false;
      let scoreEarned = 0;
      const posMarks = q.marks !== undefined ? Number(q.marks) : 1;
      const negMarks = q.negativeMarks !== undefined ? Number(q.negativeMarks) : 0;

      if (q.questionType === 'TYPING') {
        if (!typedAns || !typedAns.trim()) {
          unansweredCount++;
        } else if (typedAns.trim().toLowerCase() === (q.correctOption || '').trim().toLowerCase()) {
          isCorrect = true;
          correctCount++;
          scoreEarned = posMarks;
          totalEarnedScore += scoreEarned;
        } else {
          wrongCount++;
          scoreEarned = -Math.abs(negMarks);
          totalEarnedScore += scoreEarned;
        }
      } else {
        // MCQ or TRUE_FALSE type
        if (!selectedOpt) {
          unansweredCount++;
        } else if (selectedOpt.toUpperCase() === (q.correctOption || '').toUpperCase()) {
          isCorrect = true;
          correctCount++;
          scoreEarned = posMarks;
          totalEarnedScore += scoreEarned;
        } else {
          wrongCount++;
          scoreEarned = -Math.abs(negMarks);
          totalEarnedScore += scoreEarned;
        }
      }

      return {
        questionId: q.id,
        selectedOption: selectedOpt,
        typedAnswer: typedAns,
        isCorrect,
        scoreEarned,
        timeSpentSeconds: Number(qTimeSpent || 0)
      };
    });

    const maxScore = test.questions.reduce((acc, q) => acc + (q.marks || 1.0), 0);
    const finalScore = Math.max(0, totalEarnedScore);
    const accuracyPercentage = Math.round((correctCount / (test.questions.length || 1)) * 100);

    // Record Test Attempt
    const attempt = await prisma.testAttempt.create({
      data: {
        userId: req.user.id,
        testId,
        score: finalScore,
        maxScore,
        correctCount,
        wrongCount,
        unansweredCount,
        accuracyPercentage,
        timeTakenSeconds: timeTakenSeconds || 0,
        answers: {
          create: evaluatedAnswers
        }
      },
      include: {
        answers: {
          include: { question: true }
        }
      }
    });

    // Generate Admin Notification Alert
    await prisma.notification.create({
      data: {
        userId: null, // Admin alert
        title: '📊 Quiz Attempt Completed',
        message: `Student ${req.user.name} completed quiz "${test.title}" with score ${finalScore}/${maxScore} (${accuracyPercentage}% accuracy).`,
        type: 'QUIZ'
      }
    });

    // Clear active test session once submitted
    await prisma.activeTestSession.deleteMany({
      where: { userId: req.user.id, testId }
    });

    res.json({
      success: true,
      attempt
    });
  } catch (error) {
    console.error('Submit Test Error:', error);
    res.status(500).json({ success: false, error: 'Failed to evaluate test attempt.' });
  }
});

// Get attempt result details by attemptId (Includes Teacher Comments & Grade Override status)
router.get('/attempts/:attemptId', requireAuth, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: { questions: true }
        },
        answers: true
      }
    });

    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Attempt result not found.' });
    }

    res.json({ success: true, attempt });
  } catch (error) {
    console.error('Fetch Attempt Result Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attempt result.' });
  }
});

// Leaderboard: Common Performance Ranking for Admin & All Students
router.get('/leaderboard/top', async (req, res) => {
  try {
    const studentUsers = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true
      }
    });

    const leaderboardData = await Promise.all(
      studentUsers.map(async (student) => {
        const attempts = await prisma.testAttempt.findMany({
          where: { userId: student.id },
          include: { test: { select: { title: true } } }
        });

        const testsCount = attempts.length;
        const totalScore = attempts.reduce((acc, a) => acc + (a.score || 0), 0);
        const maxPossibleScore = attempts.reduce((acc, a) => acc + (a.maxScore || 0), 0);
        const avgAccuracy = testsCount > 0
          ? Math.round(attempts.reduce((acc, a) => acc + (a.accuracyPercentage || 0), 0) / testsCount)
          : 0;

        const highestAttempt = attempts.reduce((prev, curr) => {
          return (!prev || curr.score > prev.score) ? curr : prev;
        }, null);

        return {
          student,
          totalScore,
          maxPossibleScore,
          testsCount,
          avgAccuracy,
          bestTestTitle: highestAttempt ? highestAttempt.test?.title : 'Chapter MCQs Practice',
          highestScore: highestAttempt ? highestAttempt.score : 0,
          highestMaxScore: highestAttempt ? highestAttempt.maxScore : 0
        };
      })
    );

    // Sort by Total Points Earned desc, then Average Accuracy desc, then Tests Completed desc
    leaderboardData.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.avgAccuracy !== a.avgAccuracy) return b.avgAccuracy - a.avgAccuracy;
      return b.testsCount - a.testsCount;
    });

    const rankedLeaderboard = leaderboardData.map((item, index) => ({
      rank: index + 1,
      ...item
    }));

    res.json({ success: true, leaderboard: rankedLeaderboard });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve leaderboard.' });
  }
});

export default router;
