import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const API_BASE = 'http://localhost:5001/api';
const prisma = new PrismaClient();

async function testAllFeatures() {
  console.log('============== SARVOTTAM DIKSHA FULL FEATURE VERIFICATION TEST ==============\n');
  const results = [];

  const logResult = (feature, status, detail = '') => {
    const icon = status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} [${status}] ${feature}${detail ? ' - ' + detail : ''}`);
    results.push({ feature, status, detail });
  };

  try {
    // 1. Auth Test
    console.log('--- 1. AUTHENTICATION & PERSONALIZED WELCOME MESSAGE ---');
    const testEmail = `test_student_${Date.now()}@gmail.com`;
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Verification Student',
      email: testEmail,
      phone: '9998887776',
      password: 'password123'
    });

    let studentToken = regRes.data.token;
    let studentId = regRes.data.user.id;
    if (regRes.data.success && studentToken) {
      logResult('Student Registration', 'PASSED', `Registered: ${testEmail}`);
    } else {
      logResult('Student Registration', 'FAILED', 'Token not returned');
    }

    // Verify Welcome Message automatically created
    const conv = await prisma.conversation.findUnique({
      where: { studentId },
      include: { messages: true }
    });
    if (conv && conv.messages.length > 0 && conv.messages[0].text.includes('Dear Verification Student')) {
      logResult('Automatic Personalized Welcome Message', 'PASSED', 'Created in DB upon registration');
    } else {
      logResult('Automatic Personalized Welcome Message', 'FAILED', 'Message not found in DB');
    }

    // Login Admin
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'Dikshasarvottam@gmail.com',
      password: 'Manika@Maths2026'
    });
    const adminToken = adminLogin.data.token;
    if (adminLogin.data.success && adminToken) {
      logResult('Admin Authentication', 'PASSED', 'Log in successful as Manika Maheshwari');
    } else {
      logResult('Admin Authentication', 'FAILED', 'Admin login failed');
    }

    // 2. Courses Engine
    console.log('\n--- 2. COURSES ENGINE ---');
    const publicCourses = await axios.get(`${API_BASE}/courses`);
    if (publicCourses.data.success && Array.isArray(publicCourses.data.courses)) {
      logResult('Public Courses Catalog', 'PASSED', `Retrieved ${publicCourses.data.courses.length} published courses`);
    } else {
      logResult('Public Courses Catalog', 'FAILED', 'Could not fetch published courses');
    }

    // Create course as admin
    const newCourseRes = await axios.post(
      `${API_BASE}/admin/courses`,
      {
        title: `Verification Course ${Date.now()}`,
        description: 'Automated test course description',
        category: 'Class 10 Mathematics',
        subject: 'Mathematics',
        price: '499',
        originalPrice: '999',
        isFree: false,
        status: 'PUBLISHED'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const createdCourseId = newCourseRes.data.course?.id;
    if (newCourseRes.data.success && createdCourseId) {
      logResult('Admin Course Creation', 'PASSED', `Created course ID: ${createdCourseId}`);
    } else {
      logResult('Admin Course Creation', 'FAILED', 'Course creation failed');
    }

    // 3. Test Portal & MCQ Engine
    console.log('\n--- 3. TEST PORTAL & MCQ ENGINE ---');
    const newTestRes = await axios.post(
      `${API_BASE}/admin/tests`,
      {
        title: `Verification Practice MCQ ${Date.now()}`,
        courseId: createdCourseId || (publicCourses.data.courses[0]?.id),
        durationMinutes: 15,
        totalMarks: 10,
        passingMarks: 4,
        negativeMarks: 0.25
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const createdTestId = newTestRes.data.test?.id;
    if (newTestRes.data.success && createdTestId) {
      logResult('Admin Test Creation', 'PASSED', `Created Test ID: ${createdTestId}`);
    } else {
      logResult('Admin Test Creation', 'FAILED', 'Test creation failed');
    }

    // Add question
    const qRes = await axios.post(
      `${API_BASE}/admin/tests/${createdTestId}/questions`,
      {
        questionText: 'What is the value of sin(90°)?',
        optionA: '0',
        optionB: '1',
        optionC: '1/2',
        optionD: 'Undefined',
        correctOption: 'B',
        explanation: 'sin(90°) = 1',
        marks: 1.0
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (qRes.data.success) {
      logResult('Admin Add MCQ Question', 'PASSED', 'Question added to test');
    } else {
      logResult('Admin Add MCQ Question', 'FAILED', 'Could not add question');
    }

    // Student submit test attempt
    const submitRes = await axios.post(
      `${API_BASE}/tests/${createdTestId}/submit`,
      {
        userAnswers: { [qRes.data.question.id]: 'B' },
        timeTakenSeconds: 45
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    if (submitRes.data.success && submitRes.data.attempt?.score > 0) {
      logResult('Student Test Submission & Automated Grading', 'PASSED', `Score: ${submitRes.data.attempt.score}/${submitRes.data.attempt.maxScore}`);
    } else {
      logResult('Student Test Submission & Automated Grading', 'FAILED', 'Submission failed');
    }

    // Leaderboard
    const lbRes = await axios.get(`${API_BASE}/tests/leaderboard/top`);
    if (lbRes.data.success && Array.isArray(lbRes.data.leaderboard)) {
      logResult('Test Leaderboard', 'PASSED', `Retrieved ${lbRes.data.leaderboard.length} top performers`);
    } else {
      logResult('Test Leaderboard', 'FAILED', 'Leaderboard fetch failed');
    }

    // 4. Coupons Engine
    console.log('\n--- 4. MANAGE COUPONS & CHECKOUT ---');
    const couponCode = `TESTVERIFY_${Date.now().toString().slice(-4)}`;
    const createCouponRes = await axios.post(
      `${API_BASE}/admin/coupons`,
      {
        code: couponCode,
        title: 'Test Verification Offer',
        discountType: 'FLAT',
        discountValue: '100',
        minOrderValue: '300',
        maxUses: '50',
        status: 'ACTIVE'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (createCouponRes.data.success) {
      logResult('Admin Coupon Creation', 'PASSED', `Coupon '${couponCode}' created`);
    } else {
      logResult('Admin Coupon Creation', 'FAILED', 'Coupon creation failed');
    }

    const applyCouponRes = await axios.post(`${API_BASE}/payments/apply-coupon`, {
      couponCode,
      coursePrice: 500
    });
    if (applyCouponRes.data.success && applyCouponRes.data.discountAmount === 100) {
      logResult('Student Coupon Application at Checkout', 'PASSED', 'Calculated ₹100 discount');
    } else {
      logResult('Student Coupon Application at Checkout', 'FAILED', 'Coupon application failed');
    }

    // 5. Free Materials & Banners
    console.log('\n--- 5. FREE MATERIALS & PUBLIC BANNERS ---');
    const freeRes = await axios.get(`${API_BASE}/free-resources`);
    if (freeRes.data.success) {
      logResult('Free Study Material Hub', 'PASSED', `Retrieved ${freeRes.data.resources.length} materials`);
    } else {
      logResult('Free Study Material Hub', 'FAILED', 'Free materials fetch failed');
    }

    const bannerRes = await axios.get(`${API_BASE}/public-portals`);
    if (bannerRes.data.success) {
      logResult('Public Banners Manager', 'PASSED', `Retrieved ${bannerRes.data.portals.length} active banners`);
    } else {
      logResult('Public Banners Manager', 'FAILED', 'Banners fetch failed');
    }

    // 6. Real-Time Doubt Chats
    console.log('\n--- 6. REAL-TIME DOUBT CHATS ---');
    const sendChatRes = await axios.post(
      `${API_BASE}/chat/send`,
      { text: 'Hello Manika Maam, I have a doubt regarding trigonometry.', receiverId: studentId },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    if (sendChatRes.data.success) {
      logResult('Student Doubt Chat Send', 'PASSED', 'Message sent to teacher');
    } else {
      logResult('Student Doubt Chat Send', 'FAILED', 'Chat send failed');
    }

    const adminChatRes = await axios.get(
      `${API_BASE}/chat/messages?studentId=${studentId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (adminChatRes.data.success && adminChatRes.data.messages.length > 0) {
      logResult('Admin Chat Inbox Retrieval', 'PASSED', `Retrieved ${adminChatRes.data.messages.length} messages for student`);
    } else {
      logResult('Admin Chat Inbox Retrieval', 'FAILED', 'Admin chat fetch failed');
    }

    // 7. Admin Stats & Reports
    console.log('\n--- 7. ADMIN STATS & REPORT EXPORTS ---');
    const statsRes = await axios.get(`${API_BASE}/admin/stats`, { headers: { Authorization: `Bearer ${adminToken}` } });
    if (statsRes.data.success) {
      logResult('Admin Dashboard Analytics Stats', 'PASSED', `Total Students: ${statsRes.data.stats.totalStudents}`);
    } else {
      logResult('Admin Dashboard Analytics Stats', 'FAILED', 'Stats fetch failed');
    }

    const exportRes = await axios.post(
      `${API_BASE}/admin/export-report`,
      { reportType: 'Student Profile Data' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (exportRes.data.success && Array.isArray(exportRes.data.data)) {
      logResult('Export Data Report (JSON)', 'PASSED', `Exported ${exportRes.data.count} records`);
    } else {
      logResult('Export Data Report (JSON)', 'FAILED', 'Report export failed');
    }

    console.log('\n================ VERIFICATION SUMMARY ================');
    const passedCount = results.filter(r => r.status === 'PASSED').length;
    console.log(`TOTAL FEATURES TESTED: ${results.length}`);
    console.log(`PASSED: ${passedCount}`);
    console.log(`FAILED: ${results.length - passedCount}`);

  } catch (err) {
    console.error('Test Execution Error:', err.config?.url || err.message);
    if (err.response) {
      console.error('Response Status:', err.response.status, err.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAllFeatures();
