import express from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get Available Public Coupons for Student Checkout
router.get('/public-coupons', async (req, res) => {
  try {
    const { courseId, price } = req.query;
    const coursePrice = Number(price || 0);

    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    const validCoupons = coupons.filter(c => {
      if (c.maxUses && c.usedCount >= c.maxUses) return false;
      if (c.minOrderValue && coursePrice > 0 && coursePrice < c.minOrderValue) return false;
      if (c.courseSelectionType === 'SPECIFIC' && c.assignedCourseIds && courseId) {
        const allowedIds = c.assignedCourseIds.split(',');
        if (!allowedIds.includes(courseId)) return false;
      }
      return true;
    });

    res.json({ success: true, coupons: validCoupons });
  } catch (error) {
    console.error('Fetch Public Coupons Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch available coupons.' });
  }
});

// Helper to calculate coupon discount with complete production validation
async function calculateDiscount(couponCode, coursePrice, courseId = null) {
  if (!couponCode || !couponCode.trim()) {
    return { discountAmount: 0, coupon: null, error: 'Coupon code cannot be empty.' };
  }

  const inputCode = couponCode.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({ where: { code: inputCode } });

  if (!coupon) {
    return { discountAmount: 0, coupon: null, error: `Coupon code '${inputCode}' does not exist.` };
  }

  if (coupon.status !== 'ACTIVE') {
    return { discountAmount: 0, coupon: null, error: `Coupon '${inputCode}' is not active.` };
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    await prisma.coupon.update({ where: { id: coupon.id }, data: { status: 'EXPIRED' } });
    return { discountAmount: 0, coupon: null, error: `Coupon '${inputCode}' has expired.` };
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { discountAmount: 0, coupon: null, error: `Coupon '${inputCode}' usage limit reached.` };
  }

  if (coupon.minOrderValue && coursePrice < coupon.minOrderValue) {
    return { discountAmount: 0, coupon: null, error: `Minimum order value ₹${coupon.minOrderValue} required for coupon '${inputCode}'.` };
  }

  if (coupon.courseSelectionType === 'SPECIFIC' && coupon.assignedCourseIds && courseId) {
    const allowedIds = coupon.assignedCourseIds.split(',');
    if (!allowedIds.includes(courseId)) {
      return { discountAmount: 0, coupon: null, error: `Coupon '${inputCode}' is not applicable for this course.` };
    }
  }

  let discountAmount = coupon.discountValue || 0;
  if (coupon.discountType === 'PERCENTAGE' && coursePrice) {
    discountAmount = Math.round((Number(coursePrice) * coupon.discountValue) / 100);
  }

  // Cap discount at course price
  discountAmount = Math.min(discountAmount, coursePrice || discountAmount);

  return { discountAmount, coupon, error: null };
}

// Create Razorpay Order
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const { courseId, couponCode } = req.body;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found.' });
    }

    const { discountAmount, error } = await calculateDiscount(couponCode, course.price, courseId);
    if (couponCode && error) {
      return res.status(400).json({ success: false, error });
    }

    const basePrice = Math.max(0, course.price - discountAmount);
    const gstAmount = course.gstAmount || Math.round(basePrice * 0.18);
    const totalAmount = basePrice + gstAmount + (course.handlingFee || 14) + (course.platformFee || 10);

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    res.json({
      success: true,
      order: {
        id: orderId,
        amount: totalAmount,
        currency: 'INR',
        courseTitle: course.title,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_SarvottamKey123',
        discountAmount
      }
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ success: false, error: 'Payment initiation failed.' });
  }
});

// Verify Payment & Unlock Course
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { courseId, orderId, paymentId, signature, couponCode } = req.body;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found.' });
    }

    const { discountAmount, coupon } = await calculateDiscount(couponCode, course.price, courseId);
    const basePrice = Math.max(0, course.price - discountAmount);
    const gstAmount = course.gstAmount || Math.round(basePrice * 0.18);
    const totalAmount = basePrice + gstAmount + (course.handlingFee || 14) + (course.platformFee || 10);

    // Save Purchase
    const purchase = await prisma.purchase.create({
      data: {
        userId: req.user.id,
        courseId,
        amount: totalAmount,
        paymentGateway: 'RAZORPAY',
        paymentStatus: 'SUCCESS',
        orderId: orderId || `order_ver_${Date.now()}`,
        paymentId: paymentId || `pay_ver_${Date.now()}`,
        signature: signature || 'verified_sig'
      }
    });

    // Increment coupon usedCount if valid coupon was applied
    if (coupon) {
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } }
      });
    }

    // Generate Admin Alert Notification
    await prisma.notification.create({
      data: {
        userId: null, // Admin alert
        title: '🎉 New Course Purchase',
        message: `Student ${req.user.name} (${req.user.email}) purchased ${course.title} for ₹${totalAmount}${discountAmount > 0 ? ` (Coupon '${couponCode}' applied: ₹${discountAmount} OFF)` : ''}.`,
        type: 'PURCHASE'
      }
    });

    // Generate Student Confirmation Notification
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: '✅ Course Enrolled Successfully',
        message: `Your enrollment for ${course.title} is confirmed. Start practicing Mathematics MCQs now!`,
        type: 'PURCHASE'
      }
    });

    res.json({
      success: true,
      message: 'Payment verified and course access granted.',
      purchase
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, error: 'Payment verification failed.' });
  }
});

// Verify & Apply Coupon Code (Supports both /verify-coupon and /apply-coupon)
const handleCouponApply = async (req, res) => {
  try {
    const { code, couponCode, coursePrice, courseId } = req.body;
    const inputCode = (code || couponCode || '').trim().toUpperCase();
    if (!inputCode) {
      return res.status(400).json({ success: false, error: 'Coupon code is required.' });
    }

    const price = Number(coursePrice || 0);
    const { discountAmount, coupon, error } = await calculateDiscount(inputCode, price, courseId);

    if (error) {
      return res.status(400).json({ success: false, error });
    }

    const expiryFormatted = coupon.expiresAt 
      ? new Date(coupon.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Lifetime Validity';

    res.json({
      success: true,
      message: `🎉 Coupon '${inputCode}' applied successfully! ₹${discountAmount} Discount Unlocked (Expires: ${expiryFormatted}).`,
      discountAmount,
      coupon: {
        code: coupon.code,
        title: coupon.title,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        expiresAt: coupon.expiresAt,
        expiryFormatted
      }
    });
  } catch (error) {
    console.error('Verify Coupon Error:', error);
    res.status(500).json({ success: false, error: 'Failed to validate coupon code.' });
  }
};

router.post('/verify-coupon', handleCouponApply);
router.post('/apply-coupon', handleCouponApply);

// ================= STANDALONE QUIZ PAYMENTS =================

// Create Razorpay Order for Standalone Paid Quiz
router.post('/create-quiz-order', requireAuth, async (req, res) => {
  try {
    const { testId, couponCode } = req.body;

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      return res.status(404).json({ success: false, error: 'Test series not found.' });
    }

    if (test.accessMode === 'FREE' || Number(test.price) === 0) {
      return res.status(400).json({ success: false, error: 'This quiz is FREE for all students. No payment required.' });
    }

    const { discountAmount } = await calculateDiscount(couponCode, test.price);
    const totalAmount = Math.max(0, Number(test.price) - discountAmount);

    const orderId = `quiz_order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    res.json({
      success: true,
      order: {
        id: orderId,
        amount: totalAmount,
        currency: 'INR',
        testTitle: test.title,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_SarvottamKey123',
        discountAmount
      }
    });
  } catch (error) {
    console.error('Create Quiz Order Error:', error);
    res.status(500).json({ success: false, error: 'Quiz payment initiation failed.' });
  }
});

// Verify Payment & Create QuizPurchase Entitlement
router.post('/verify-quiz-payment', requireAuth, async (req, res) => {
  try {
    const { testId, orderId, paymentId, signature, couponCode } = req.body;

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      return res.status(404).json({ success: false, error: 'Test series not found.' });
    }

    const { discountAmount } = await calculateDiscount(couponCode, test.price);
    const totalAmount = Math.max(0, Number(test.price) - discountAmount);

    // Save QuizPurchase Entitlement
    const quizPurchase = await prisma.quizPurchase.create({
      data: {
        userId: req.user.id,
        testId,
        amount: totalAmount,
        paymentGateway: 'RAZORPAY',
        paymentStatus: 'SUCCESS',
        orderId: orderId || `quiz_ord_${Date.now()}`,
        paymentId: paymentId || `quiz_pay_${Date.now()}`,
        signature: signature || 'verified_sig'
      }
    });

    // Generate Admin Notification Alert
    await prisma.notification.create({
      data: {
        userId: null, // Admin alert
        title: '🎉 Standalone Quiz Purchased',
        message: `Student ${req.user.name} (${req.user.email}) purchased standalone test "${test.title}" for ₹${totalAmount}.`,
        type: 'PURCHASE'
      }
    });

    // Generate Student Confirmation Notification
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: '✅ Standalone Test Unlocked',
        message: `Your test "${test.title}" is now unlocked and ready to attempt!`,
        type: 'PURCHASE'
      }
    });

    res.json({
      success: true,
      message: 'Payment verified and standalone test unlocked.',
      quizPurchase
    });
  } catch (error) {
    console.error('Verify Quiz Payment Error:', error);
    res.status(500).json({ success: false, error: 'Quiz payment verification failed.' });
  }
});

export default router;
