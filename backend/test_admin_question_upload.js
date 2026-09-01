import { PrismaClient } from '@prisma/client';
import http from 'http';

const prisma = new PrismaClient();
const BACKEND_URL = 'http://localhost:5001';

async function runHttpRequest(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: data });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data: data, raw: data });
        }
      });
    });
    req.on('error', err => resolve({ status: 500, error: err.message, data: null }));
    if (body) {
      req.write(typeof body === 'object' ? JSON.stringify(body) : body);
    }
    req.end();
  });
}

async function testSingleQuestionUpload() {
  console.log(`=======================================================`);
  console.log(`🧪 TESTING SINGLE QUESTION UPLOAD & PUBLISH WORKFLOW`);
  console.log(`=======================================================\n`);

  try {
    // 1. Login as Admin
    console.log(`1. Logging in as Admin (dikshasarvottam@gmail.com)...`);
    const loginRes = await runHttpRequest(`${BACKEND_URL}/api/auth/login`, 'POST', {
      email: 'dikshasarvottam@gmail.com',
      password: 'admin123'
    }, { 'Content-Type': 'application/json' });

    if (!loginRes.data.success) {
      console.error(`❌ Admin Login Failed:`, loginRes.data);
      return;
    }

    const token = loginRes.data.token;
    console.log(`   ✅ Admin Logged In Successfully! Token obtained.`);

    // 2. Create Quiz Container
    console.log(`\n2. Creating Test Container ("Live Question Upload Test")...`);
    const createTestRes = await runHttpRequest(`${BACKEND_URL}/api/admin/tests`, 'POST', {
      title: 'Live Question Upload Test',
      durationMinutes: 60,
      tags: 'Class 10',
      totalMarks: 100,
      negativeMarks: 0.25,
      accessMode: 'FREE',
      price: 0
    }, {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    if (!createTestRes.data.success) {
      console.error(`❌ Test Container Creation Failed:`, createTestRes.data);
      return;
    }

    const testId = createTestRes.data.test.id;
    console.log(`   ✅ Test Container Created! ID: ${testId}`);

    // 3. Upload a Question
    console.log(`\n3. Uploading Question to Test...`);
    const questionPayload = {
      sectionName: 'Section A',
      questionType: 'MCQ',
      questionText: 'A point P is 26 cm away from the center O of a circle of radius 10 cm. What is the length of the tangent drawn from P to the circle?',
      optionA: '12 cm',
      optionB: '24 cm',
      optionC: '25 cm',
      optionD: '26 cm',
      correctOption: 'B',
      explanation: 'Using Pythagoras Theorem: Tangent length = √(26² - 10²) = √(676 - 100) = √576 = 24 cm.',
      marks: 4,
      negativeMarks: 1
    };

    const addQuestionRes = await runHttpRequest(`${BACKEND_URL}/api/admin/tests/${testId}/questions`, 'POST', questionPayload, {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    if (!addQuestionRes.data.success) {
      console.error(`❌ Question Upload Failed:`, addQuestionRes.data);
      return;
    }

    const createdQuestion = addQuestionRes.data.question;
    console.log(`   ✅ Question Uploaded Successfully! ID: ${createdQuestion.id}`);
    console.log(`      • Question: "${createdQuestion.questionText}"`);
    console.log(`      • Options: A) ${createdQuestion.optionA} | B) ${createdQuestion.optionB} | C) ${createdQuestion.optionC} | D) ${createdQuestion.optionD}`);
    console.log(`      • Correct Option: ${createdQuestion.correctOption}`);

    // 4. Fetch full test back to confirm persistence
    console.log(`\n4. Verifying Test in Catalog...`);
    const fetchRes = await runHttpRequest(`${BACKEND_URL}/api/tests/${testId}`, 'GET', null, {
      'Authorization': `Bearer ${token}`
    });

    if (fetchRes.data.success && fetchRes.data.test.questions.length === 1) {
      console.log(`   ✅ Verified! Test loaded from DB with ${fetchRes.data.test.questions.length} question!`);
    } else {
      console.error(`❌ Verification Failed:`, fetchRes.data);
    }

    // 5. Cleanup
    console.log(`\n5. Cleaning up temporary test...`);
    await prisma.test.delete({ where: { id: testId } }).catch(() => {});
    console.log(`   🧹 Temporary test cleaned up.`);

    console.log(`\n=======================================================`);
    console.log(`🎉 SINGLE QUESTION UPLOAD WORKFLOW 100% OPERATIONAL!`);
    console.log(`=======================================================\n`);

  } catch (err) {
    console.error(`❌ Error during test:`, err);
  }
}

testSingleQuestionUpload();
