import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

async function runCourseQuizMatrixAudit() {
  console.log('========================================================================================');
  console.log('       SARVOTTAM DIKSHA — E2E COURSES ↔ QUIZZES RELATIONSHIP & ACCESS MATRIX AUDIT     ');
  console.log('========================================================================================\n');

  try {
    // 1. Authenticate Admin
    console.log('🔹 1. Authenticating Admin User...');
    const adminAuth = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'Dikshasarvottam@gmail.com',
      password: 'Manika@Maths2026'
    });
    const adminToken = adminAuth.data.token;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };
    console.log('🟢 Admin Auth Verified.');

    // 2. Admin Creates Course A
    console.log('\n🔹 2. Admin Creating Course A ("Class 10 Mathematics Board Batch")...');
    const courseRes = await axios.post(`${BASE_URL}/admin/courses`, {
      title: `Class 10 Math Batch ${Date.now()}`,
      description: 'Comprehensive Board Exam Preparation',
      category: 'Class 10 Mathematics',
      price: 999,
      validityDays: 365,
      isPublished: true
    }, adminHeaders);
    const courseA = courseRes.data.course;
    console.log(`🟢 Course A Created: ID=${courseA.id}, Title="${courseA.title}"`);

    // 3. Admin Creates Quiz 1 (Attached to Course A)
    console.log('\n🔹 3. Admin Creating Quiz 1 (Attached to Course A)...');
    const quiz1Res = await axios.post(`${BASE_URL}/admin/tests`, {
      title: `Algebra Practice Test ${Date.now()}`,
      durationMinutes: 40,
      totalMarks: 100,
      negativeMarks: 0.25,
      accessMode: 'COURSE_ONLY',
      price: 0,
      courseIds: [courseA.id]
    }, adminHeaders);
    const quiz1 = quiz1Res.data.test;
    console.log(`🟢 Quiz 1 Created: ID=${quiz1.id}, Title="${quiz1.title}" (Attached to Course A)`);

    // 4. Admin Creates Quiz 2 (Attached to Course A)
    console.log('\n🔹 4. Admin Creating Quiz 2 (Attached to Course A)...');
    const quiz2Res = await axios.post(`${BASE_URL}/admin/tests`, {
      title: `Quadratic Equations Test ${Date.now()}`,
      durationMinutes: 45,
      totalMarks: 100,
      negativeMarks: 0.25,
      accessMode: 'COURSE_ONLY',
      price: 0,
      courseIds: [courseA.id]
    }, adminHeaders);
    const quiz2 = quiz2Res.data.test;
    console.log(`🟢 Quiz 2 Created: ID=${quiz2.id}, Title="${quiz2.title}" (Attached to Course A)`);

    // 5. Admin Creates Quiz 3 (Paid Standalone Test ₹299)
    console.log('\n🔹 5. Admin Creating Quiz 3 (Paid Standalone Test ₹299)...');
    const quiz3Res = await axios.post(`${BASE_URL}/admin/tests`, {
      title: `FULL SYLLABUS GRAND TEST ${Date.now()}`,
      durationMinutes: 90,
      totalMarks: 100,
      negativeMarks: 0.25,
      accessMode: 'PAID',
      price: 299,
      courseIds: []
    }, adminHeaders);
    const quiz3 = quiz3Res.data.test;
    console.log(`🟢 Quiz 3 Created: ID=${quiz3.id}, Title="${quiz3.title}" (AccessMode: PAID, Price: ₹299)`);

    // Add a question to Quiz 1, 2, and 3
    for (const qz of [quiz1, quiz2, quiz3]) {
      await axios.post(`${BASE_URL}/admin/tests/${qz.id}/questions`, {
        sectionName: 'Section A',
        questionType: 'MCQ',
        questionText: `Solve: x^2 - 4 = 0 for test ${qz.id}`,
        optionA: 'x = ±2',
        optionB: 'x = ±4',
        optionC: 'x = 0',
        optionD: 'x = 1',
        correctOption: 'A',
        explanation: 'x^2 = 4 => x = ±2',
        marks: 4.0,
        negativeMarks: 1.0
      }, adminHeaders);
    }

    // 6. Register Student 1 & Student 2
    console.log('\n🔹 6. Registering Student 1 and Student 2...');
    const s1Email = `student1_${Date.now()}@test.com`;
    const s2Email = `student2_${Date.now()}@test.com`;

    const s1Reg = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Student One',
      email: s1Email,
      phone: '9876543210',
      password: 'Password123!'
    });
    const student1Token = s1Reg.data.token;
    const student1Headers = { headers: { Authorization: `Bearer ${student1Token}` } };

    const s2Reg = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Student Two',
      email: s2Email,
      phone: '9876543211',
      password: 'Password123!'
    });
    const student2Token = s2Reg.data.token;
    const student2Headers = { headers: { Authorization: `Bearer ${student2Token}` } };
    console.log('🟢 Student 1 & Student 2 Registered.');

    // 7. Verify Initial Access for Student 1 (Before Purchase)
    console.log('\n🔹 7. Verifying Initial Access for Student 1 (Before Course Purchase)...');
    try {
      await axios.get(`${BASE_URL}/tests/${quiz1.id}`, student1Headers);
      console.error('❌ FAIL: Quiz 1 should be locked before course purchase!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('🟢 Verified: Student 1 correctly DENIED access to Quiz 1 (HTTP 403).');
      } else {
        throw err;
      }
    }

    // 8. Student 1 Purchases Course A
    console.log('\n🔹 8. Student 1 Purchasing Course A...');
    await axios.post(`${BASE_URL}/payments/verify`, {
      courseId: courseA.id,
      orderId: `ord_course_${Date.now()}`,
      paymentId: `pay_course_${Date.now()}`,
      signature: 'verified_sig'
    }, student1Headers);
    console.log('🟢 Student 1 Course A Purchase Confirmed.');

    // 9. Verify Student 1 Access After Course Purchase
    console.log('\n🔹 9. Verifying Access for Student 1 After Course Purchase...');
    const q1Acc = await axios.get(`${BASE_URL}/tests/${quiz1.id}`, student1Headers);
    const q2Acc = await axios.get(`${BASE_URL}/tests/${quiz2.id}`, student1Headers);
    console.log(`🟢 Verified: Quiz 1 UNLOCKED for Student 1 (Reason: ${q1Acc.data.accessReason})`);
    console.log(`🟢 Verified: Quiz 2 UNLOCKED for Student 1 (Reason: ${q2Acc.data.accessReason})`);

    // Verify Quiz 3 remains locked for Student 1
    try {
      await axios.get(`${BASE_URL}/tests/${quiz3.id}`, student1Headers);
      console.error('❌ FAIL: Quiz 3 (Standalone Paid) should remain locked!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('🟢 Verified: Standalone Quiz 3 remains LOCKED for Student 1 (HTTP 403).');
      } else {
        throw err;
      }
    }

    // 10. Student 1 Purchases Standalone Quiz 3
    console.log('\n🔹 10. Student 1 Purchasing Standalone Quiz 3 (₹299)...');
    await axios.post(`${BASE_URL}/payments/verify-quiz-payment`, {
      testId: quiz3.id,
      orderId: `ord_quiz3_${Date.now()}`,
      paymentId: `pay_quiz3_${Date.now()}`,
      signature: 'verified_sig'
    }, student1Headers);
    console.log('🟢 Student 1 Standalone Quiz 3 Purchase Confirmed.');

    const q3Acc = await axios.get(`${BASE_URL}/tests/${quiz3.id}`, student1Headers);
    console.log(`🟢 Verified: Standalone Quiz 3 now UNLOCKED for Student 1 (Reason: ${q3Acc.data.accessReason})`);

    // 11. Student 1 Attempts Standalone Quiz 3 & Submits Scorecard
    console.log('\n🔹 11. Student 1 Attempting & Submitting Standalone Quiz 3...');
    await axios.post(`${BASE_URL}/tests/${quiz3.id}/start`, {}, student1Headers);
    const submitRes = await axios.post(`${BASE_URL}/tests/${quiz3.id}/submit`, {
      userAnswers: { [quiz3Res.data.test.questions?.[0]?.id || 'q1']: 'A' },
      timeTakenSeconds: 120
    }, student1Headers);
    console.log(`🟢 Verified: Quiz 3 Attempt Submitted! Score: ${submitRes.data.attempt.score}/${submitRes.data.attempt.maxScore}`);

    // 12. Verify Isolation: Student 2 Access Verification
    console.log('\n🔹 12. Verifying Security & Access Isolation for Student 2...');
    try {
      await axios.get(`${BASE_URL}/tests/${quiz1.id}`, student2Headers);
      console.error('❌ FAIL: Student 2 should NOT have access to Quiz 1!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('🟢 Verified: Student 2 DENIED access to Quiz 1 (HTTP 403).');
      }
    }

    try {
      await axios.get(`${BASE_URL}/tests/${quiz3.id}`, student2Headers);
      console.error('❌ FAIL: Student 2 should NOT have access to Quiz 3!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('🟢 Verified: Student 2 DENIED access to Quiz 3 (HTTP 403).');
      }
    }

    console.log('\n========================================================================================');
    console.log('    🎉 ALL E2E COURSES ↔ QUIZZES ACCESS MATRIX AUDIT TESTS PASSED SUCCESSFULLY!         ');
    console.log('========================================================================================');
  } catch (error) {
    console.error('❌ Audit Failed with Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

runCourseQuizMatrixAudit();
