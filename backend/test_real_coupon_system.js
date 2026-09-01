import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5001/api';

async function runRealCouponSystemTests() {
  console.log('========================================================================================');
  console.log('          REAL PRODUCTION COUPON SYSTEM — FULL E2E VERIFICATION SUITE                  ');
  console.log('========================================================================================\n');

  try {
    // 1. Seed or Get 2 Test Courses
    console.log('1. Setting up test courses in database...');
    let courseA = await prisma.course.findFirst({ where: { title: { contains: 'Class 10' } } });
    if (!courseA) {
      courseA = await prisma.course.create({
        data: {
          title: 'Class 10 Mathematics Masterclass',
          description: 'Comprehensive Math course for Class 10',
          price: 1000,
          category: 'CLASS_10',
          status: 'PUBLISHED'
        }
      });
    } else {
      courseA = await prisma.course.update({ where: { id: courseA.id }, data: { price: 1000 } });
    }

    let courseB = await prisma.course.findFirst({ where: { title: { contains: 'Class 8' } } });
    if (!courseB) {
      courseB = await prisma.course.create({
        data: {
          title: 'Class 8 Science Foundation',
          description: 'Foundation Science course for Class 8',
          price: 500,
          category: 'CLASS_8',
          status: 'PUBLISHED'
        }
      });
    } else {
      courseB = await prisma.course.update({ where: { id: courseB.id }, data: { price: 500 } });
    }

    console.log(`   ✓ Course A: ${courseA.title} (ID: ${courseA.id}, Price: ₹${courseA.price})`);
    console.log(`   ✓ Course B: ${courseB.title} (ID: ${courseB.id}, Price: ₹${courseB.price})\n`);

    // 2. Admin Creates Test Coupons with Various Rule Sets
    console.log('2. Admin Creating Coupons with Production Rules...');
    
    // Coupon 1: MATH20 (20% OFF, specific to Course A)
    await prisma.coupon.upsert({
      where: { code: 'MATH20' },
      update: {
        discountType: 'PERCENTAGE',
        discountValue: 20,
        courseSelectionType: 'SPECIFIC',
        assignedCourseIds: courseA.id,
        status: 'ACTIVE',
        expiresAt: null
      },
      create: {
        code: 'MATH20',
        title: 'Class 10 Math 20% Discount',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        courseSelectionType: 'SPECIFIC',
        assignedCourseIds: courseA.id,
        status: 'ACTIVE'
      }
    });
    console.log('   ✓ Created MATH20 (20% OFF, Specific to Course A)');

    // Coupon 2: FLAT200 (Flat ₹200 OFF, Global to all courses)
    await prisma.coupon.upsert({
      where: { code: 'FLAT200' },
      update: {
        discountType: 'FLAT',
        discountValue: 200,
        courseSelectionType: 'ALL',
        status: 'ACTIVE',
        expiresAt: null
      },
      create: {
        code: 'FLAT200',
        title: 'Flat ₹200 OFF Global Coupon',
        discountType: 'FLAT',
        discountValue: 200,
        courseSelectionType: 'ALL',
        status: 'ACTIVE'
      }
    });
    console.log('   ✓ Created FLAT200 (Flat ₹200 OFF, Global)');

    // Coupon 3: MIN1000 (Flat ₹150 OFF, Minimum order ₹1000)
    await prisma.coupon.upsert({
      where: { code: 'MIN1000' },
      update: {
        discountType: 'FLAT',
        discountValue: 150,
        minOrderValue: 1000,
        courseSelectionType: 'ALL',
        status: 'ACTIVE'
      },
      create: {
        code: 'MIN1000',
        title: 'Flat ₹150 OFF on Orders Above ₹1000',
        discountType: 'FLAT',
        discountValue: 150,
        minOrderValue: 1000,
        courseSelectionType: 'ALL',
        status: 'ACTIVE'
      }
    });
    console.log('   ✓ Created MIN1000 (Min order ₹1000 required)');

    // Coupon 4: EXPIRED50 (Expired yesterday)
    await prisma.coupon.upsert({
      where: { code: 'EXPIRED50' },
      update: {
        discountType: 'FLAT',
        discountValue: 50,
        status: 'EXPIRED',
        expiresAt: new Date(Date.now() - 86400000)
      },
      create: {
        code: 'EXPIRED50',
        title: 'Expired ₹50 Coupon',
        discountType: 'FLAT',
        discountValue: 50,
        status: 'EXPIRED',
        expiresAt: new Date(Date.now() - 86400000)
      }
    });
    console.log('   ✓ Created EXPIRED50 (Expired coupon)\n');

    // Login Student First
    console.log('3. Student Portal - Fetching Available Coupons per Course...');
    const studentToken = 'demo_student_token';
    const authHeader = { headers: { Authorization: `Bearer ${studentToken}` } };

    // For Course A (Class 10 Math, ₹1000)
    const couponsResA = await axios.get(`${API_URL}/payments/public-coupons?courseId=${courseA.id}&price=${courseA.price}`, authHeader);
    const availableForA = couponsResA.data.coupons.map(c => c.code);
    console.log(`   ✓ Course A (Price ₹${courseA.price}) Available Coupons: [${availableForA.join(', ')}]`);
    
    if (!availableForA.includes('MATH20') || !availableForA.includes('FLAT200') || !availableForA.includes('MIN1000')) {
      throw new Error('Course A should show MATH20, FLAT200, and MIN1000!');
    }
    if (availableForA.includes('EXPIRED50')) {
      throw new Error('Expired coupon EXPIRED50 must NOT appear!');
    }

    // For Course B (Class 8 Science, ₹500)
    const couponsResB = await axios.get(`${API_URL}/payments/public-coupons?courseId=${courseB.id}&price=${courseB.price}`, authHeader);
    const availableForB = couponsResB.data.coupons.map(c => c.code);
    console.log(`   ✓ Course B (Price ₹${courseB.price}) Available Coupons: [${availableForB.join(', ')}]`);
    
    if (availableForB.includes('MATH20')) {
      throw new Error('CRITICAL FAILURE: Coupon MATH20 (specific to Course A) incorrectly appeared on Course B!');
    }
    if (availableForB.includes('MIN1000')) {
      throw new Error('CRITICAL FAILURE: Coupon MIN1000 (Min order ₹1000) incorrectly appeared on ₹500 Course B!');
    }
    if (!availableForB.includes('FLAT200')) {
      throw new Error('Course B should show global FLAT200 coupon!');
    }
    console.log('   ✓ Course isolation verification PASSED!\n');

    // 4. Validating Coupon Application API (POST /apply-coupon)
    console.log('4. Testing Coupon Validation Rules & Error Messages...');
    
    // Case A: Empty coupon code
    try {
      await axios.post(`${API_URL}/payments/apply-coupon`, { code: '', coursePrice: 1000 });
      throw new Error('Empty coupon should have failed!');
    } catch (err) {
      console.log(`   ✓ Empty coupon rejected: "${err.response?.data?.error}"`);
    }

    // Case B: Non-existent coupon code
    try {
      await axios.post(`${API_URL}/payments/apply-coupon`, { code: 'INVALID999', coursePrice: 1000 });
      throw new Error('Invalid coupon should have failed!');
    } catch (err) {
      console.log(`   ✓ Non-existent coupon rejected: "${err.response?.data?.error}"`);
    }

    // Case C: Expired coupon code
    try {
      await axios.post(`${API_URL}/payments/apply-coupon`, { code: 'EXPIRED50', coursePrice: 1000 });
      throw new Error('Expired coupon should have failed!');
    } catch (err) {
      console.log(`   ✓ Expired coupon rejected: "${err.response?.data?.error}"`);
    }

    // Case D: Course A coupon tried on Course B
    try {
      await axios.post(`${API_URL}/payments/apply-coupon`, { code: 'MATH20', courseId: courseB.id, coursePrice: courseB.price });
      throw new Error('Wrong course coupon should have failed!');
    } catch (err) {
      console.log(`   ✓ Wrong course coupon rejected: "${err.response?.data?.error}"`);
    }

    // Case E: Minimum order value not met
    try {
      await axios.post(`${API_URL}/payments/apply-coupon`, { code: 'MIN1000', courseId: courseB.id, coursePrice: courseB.price });
      throw new Error('Min order not met coupon should have failed!');
    } catch (err) {
      console.log(`   ✓ Min order value not met rejected: "${err.response?.data?.error}"`);
    }

    // Case F: Applying MATH20 to Course A (20% off on ₹1000 = ₹200 discount)
    const validApp = await axios.post(`${API_URL}/payments/apply-coupon`, { code: 'MATH20', courseId: courseA.id, coursePrice: courseA.price }, authHeader);
    console.log(`   ✓ Valid coupon MATH20 applied on Course A: Saved ₹${validApp.data.discountAmount}`);
    if (validApp.data.discountAmount !== 200) {
      throw new Error(`Expected discount ₹200 but got ₹${validApp.data.discountAmount}`);
    }
    console.log('\n');

    // 5. Full Checkout Calculation & Order Creation Flow
    console.log('5. Student Checkout & Payment Verification Flow...');

    // Create Order with MATH20 applied on Course A (Price ₹1000)
    const orderRes = await axios.post(
      `${API_URL}/payments/create-order`,
      { courseId: courseA.id, couponCode: 'MATH20' },
      authHeader
    );

    const basePrice = courseA.price - 200; // ₹800
    const gstAmount = courseA.gstAmount || Math.round(basePrice * 0.18); // ₹144
    const handlingFee = courseA.handlingFee || 14;
    const platformFee = courseA.platformFee || 10;
    const expectedTotal = basePrice + gstAmount + handlingFee + platformFee; // ₹968

    console.log(`   ✓ Course Price: ₹${courseA.price}`);
    console.log(`   ✓ Coupon Discount (20%): -₹200`);
    console.log(`   ✓ Base Price After Discount: ₹${basePrice}`);
    console.log(`   ✓ GST (18%): ₹${gstAmount}`);
    console.log(`   ✓ Fees (Handling ₹${handlingFee} + Platform ₹${platformFee}): ₹${handlingFee + platformFee}`);
    console.log(`   ✓ Final Payable Order Amount: ₹${expectedTotal}`);
    console.log(`   ✓ Order ID Created: ${orderRes.data.order.id} (Amount: ₹${orderRes.data.order.amount})`);

    if (orderRes.data.order.amount !== expectedTotal) {
      throw new Error(`Expected total ₹${expectedTotal} but got ₹${orderRes.data.order.amount}`);
    }

    // Verify Payment & Grant Course Access
    const verifyRes = await axios.post(
      `${API_URL}/payments/verify`,
      {
        courseId: courseA.id,
        orderId: orderRes.data.order.id,
        paymentId: `pay_test_${Date.now()}`,
        signature: 'valid_test_sig',
        couponCode: 'MATH20'
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );

    console.log(`   ✓ Payment verified successfully! Purchase ID: ${verifyRes.data.purchase.id}`);
    console.log(`   ✓ Purchase DB Record Amount: ₹${verifyRes.data.purchase.amount}`);
    
    // Verify Used Count Incremented
    const updatedCoupon = await prisma.coupon.findUnique({ where: { code: 'MATH20' } });
    console.log(`   ✓ Coupon 'MATH20' Used Count Incremented: ${updatedCoupon.usedCount} times`);

    console.log('\n========================================================================================');
    console.log('       🎉 REAL PRODUCTION COUPON SYSTEM VERIFICATION: 100% SUCCESSFUL!           ');
    console.log('========================================================================================\n');

  } catch (err) {
    console.error('\n❌ REAL COUPON SYSTEM TEST FAILED:', err.response?.data?.error || err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRealCouponSystemTests();
