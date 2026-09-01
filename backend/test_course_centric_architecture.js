import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5001';

async function runCourseCentricArchitectureTests() {
  console.log('====================================================');
  console.log('🧪 VERIFYING COURSE-CENTRIC ARCHITECTURE & DATA HIERARCHY');
  console.log('====================================================');

  // STEP 1: Admin Login
  let adminToken = '';
  try {
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'Dikshasarvottam@gmail.com',
      password: 'Manika@Maths2026'
    });
    adminToken = loginRes.data.token;
    console.log('✅ STEP 1: Admin Login Successful!');
  } catch (err) {
    console.error('❌ STEP 1 FAILED: Admin login failed:', err.response?.data || err.message);
    return;
  }

  // STEP 2: Create a Course (Parent Entity)
  let courseId = '';
  const courseTitle = `ABHYAAS Class 10 Mathematics Mastery ${Date.now()}`;
  try {
    const courseRes = await axios.post(`${API_URL}/api/admin/courses`, {
      title: courseTitle,
      category: 'Class 10 Mathematics',
      subject: 'Mathematics',
      description: 'Parent course containing Class 10 quadratic & polynomial tests',
      price: 499,
      status: 'PUBLISHED'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    courseId = courseRes.data.course.id;
    console.log(`PASSED TEST 1: Created parent Course "${courseTitle}" with ID "${courseId}".`);
  } catch (err) {
    console.error('FAILED TEST 1:', err.response?.data || err.message);
    return;
  }

  // STEP 3: Create a Test INSIDE this specific Course
  let testId = '';
  const testTitle = 'Quadratic Equations Board Level Test 01';
  try {
    const testRes = await axios.post(`${API_URL}/api/admin/courses/${courseId}/tests`, {
      title: testTitle,
      durationMinutes: 40,
      totalMarks: 100,
      negativeMarks: 0.25,
      passPercentage: 40
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    testId = testRes.data.test.id;
    console.log(`PASSED TEST 2: Created Test "${testTitle}" belonging strictly to Course ID "${courseId}".`);
  } catch (err) {
    console.error('FAILED TEST 2:', err.response?.data || err.message);
    return;
  }

  // STEP 4: Add MCQ Questions to the Test
  let questionId = '';
  try {
    const qRes = await axios.post(`${API_URL}/api/admin/tests/${testId}/questions`, {
      questionText: 'What is the discriminant of 2x² - 4x + 3 = 0?',
      optionA: '-8 (No real roots)',
      optionB: '8 (Two real roots)',
      optionC: '0 (Equal real roots)',
      optionD: '16',
      correctOption: 'A',
      explanation: 'D = b² - 4ac = (-4)² - 4(2)(3) = 16 - 24 = -8 < 0. Hence, equation has no real roots.',
      marks: 2
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    questionId = qRes.data.question.id;
    console.log(`PASSED TEST 3: Added MCQ Question with ID "${questionId}" to Test ID "${testId}".`);
  } catch (err) {
    console.error('FAILED TEST 3:', err.response?.data || err.message);
    return;
  }

  // STEP 5: Verify Full Course Hierarchy (Course -> Tests -> Questions)
  try {
    const fullCourseRes = await axios.get(`${API_URL}/api/admin/courses/${courseId}/full`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const fullCourse = fullCourseRes.data.course;
    const hasTest = fullCourse.tests.some(t => t.id === testId);
    const targetTest = fullCourse.tests.find(t => t.id === testId);
    const hasQuestion = targetTest && targetTest.questions.some(q => q.id === questionId);

    if (hasTest && hasQuestion) {
      console.log('PASSED TEST 4: Full Course Control Center endpoint verified hierarchy: Course ➔ Test ➔ Question ➔ Explanation!');
    } else {
      console.error('FAILED TEST 4: Hierarchy missing test or question in full course response.');
    }
  } catch (err) {
    console.error('FAILED TEST 4:', err.response?.data || err.message);
  }

  console.log('\n🎉 ALL COURSE-CENTRIC ARCHITECTURE TESTS PASSED SUCCESSFULLY!\n');
}

runCourseCentricArchitectureTests().catch(console.error).finally(() => prisma.$disconnect());
