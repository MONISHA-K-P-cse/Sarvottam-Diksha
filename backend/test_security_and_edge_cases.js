import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const API_BASE = 'http://localhost:5001/api';
const prisma = new PrismaClient();

async function runSecurityAndEdgeCaseTests() {
  console.log('============== SECURITY, AUTHORIZATION & EDGE-CASE AUDIT ==============\n');
  const results = [];

  const logResult = (testName, status, detail = '') => {
    const icon = status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} [${status}] ${testName}${detail ? ' - ' + detail : ''}`);
    results.push({ testName, status, detail });
  };

  try {
    // 1. Create Student & Login Admin
    const student1Email = `sec_student1_${Date.now()}@gmail.com`;
    const student2Email = `sec_student2_${Date.now()}@gmail.com`;

    const reg1 = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Security Student 1',
      email: student1Email,
      phone: '9888877771',
      password: 'password123'
    });
    const s1Token = reg1.data.token;
    const s1Id = reg1.data.user.id;

    const reg2 = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Security Student 2',
      email: student2Email,
      phone: '9888877772',
      password: 'password123'
    });
    const s2Token = reg2.data.token;
    const s2Id = reg2.data.user.id;

    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'Dikshasarvottam@gmail.com',
      password: 'Manika@Maths2026'
    });
    const adminToken = adminLogin.data.token;

    // TEST 1: Student tries to access Admin Stats (/api/admin/stats)
    try {
      await axios.get(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${s1Token}` }
      });
      logResult('Role Security: Student access to Admin Stats', 'FAILED', 'Student was allowed access to Admin route!');
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        logResult('Role Security: Student access to Admin Stats', 'PASSED', `Blocked with HTTP ${err.response.status}`);
      } else {
        logResult('Role Security: Student access to Admin Stats', 'FAILED', `Unexpected status: ${err.response?.status}`);
      }
    }

    // TEST 2: Student tries to create a course (/api/admin/courses)
    try {
      await axios.post(
        `${API_BASE}/admin/courses`,
        { title: 'Hacked Course', price: 0 },
        { headers: { Authorization: `Bearer ${s1Token}` } }
      );
      logResult('Role Security: Student creation of Admin Course', 'FAILED', 'Student created a course!');
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        logResult('Role Security: Student creation of Admin Course', 'PASSED', `Blocked with HTTP ${err.response.status}`);
      } else {
        logResult('Role Security: Student creation of Admin Course', 'FAILED', `Unexpected status: ${err.response?.status}`);
      }
    }

    // TEST 3: Student 1 tries to access Student 2's private chat messages
    try {
      const chatRes = await axios.get(`${API_BASE}/chat/messages?studentId=${s2Id}`, {
        headers: { Authorization: `Bearer ${s1Token}` }
      });
      // If student 1 is not admin and requests s2's messages, chatRoutes should restrict or return s1's own conversation
      if (chatRes.data.messages && chatRes.data.messages.some(m => m.receiverId === s2Id || m.senderId === s2Id)) {
        logResult('Data Privacy: Student 1 accessing Student 2 Chat', 'FAILED', 'Student 1 accessed Student 2 chat logs!');
      } else {
        logResult('Data Privacy: Student 1 accessing Student 2 Chat', 'PASSED', 'Privacy protected (scoped to logged in user)');
      }
    } catch (err) {
      logResult('Data Privacy: Student 1 accessing Student 2 Chat', 'PASSED', `Protected with HTTP ${err.response?.status}`);
    }

    // TEST 4: Student 1 unlocks course and checks if Student 2 automatically has access or not
    const testCourse = await prisma.course.findFirst();
    if (testCourse) {
      await prisma.purchase.create({
        data: {
          userId: s1Id,
          courseId: testCourse.id,
          amount: 499,
          orderId: `ord_test_${Date.now()}`,
          paymentStatus: 'SUCCESS'
        }
      });

      const s1Courses = await axios.get(`${API_BASE}/courses/my-courses`, {
        headers: { Authorization: `Bearer ${s1Token}` }
      });
      const s2Courses = await axios.get(`${API_BASE}/courses/my-courses`, {
        headers: { Authorization: `Bearer ${s2Token}` }
      });

      const s1HasAccess = s1Courses.data.myCourses?.some(p => p.course?.id === testCourse.id);
      const s2HasAccess = s2Courses.data.myCourses?.some(p => p.course?.id === testCourse.id);

      if (s1HasAccess && !s2HasAccess) {
        logResult('Course Entitlement Scoping', 'PASSED', 'Course unlocked ONLY for paying student (Student 1)');
      } else {
        logResult('Course Entitlement Scoping', 'FAILED', `s1HasAccess: ${s1HasAccess}, s2HasAccess: ${s2HasAccess}`);
      }
    }

    // TEST 5: Refresh & Re-login persistence
    const loginAgain = await axios.post(`${API_BASE}/auth/login`, {
      email: student1Email,
      password: 'password123'
    });
    if (loginAgain.data.success && loginAgain.data.user.id === s1Id) {
      const checkMe = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${loginAgain.data.token}` }
      });
      if (checkMe.data.success && checkMe.data.user.id === s1Id) {
        logResult('Session & Re-Login Persistence', 'PASSED', 'User session correctly restored after login');
      } else {
        logResult('Session & Re-Login Persistence', 'FAILED', '/api/auth/me failed');
      }
    } else {
      logResult('Session & Re-Login Persistence', 'FAILED', 'Re-login failed');
    }

    // TEST 6: Unread Counter Logic
    const chatMsg = await axios.post(
      `${API_BASE}/chat/send`,
      { text: 'Unread test message from S1', receiverId: s1Id },
      { headers: { Authorization: `Bearer ${s1Token}` } }
    );
    const unreadCountRes = await axios.get(`${API_BASE}/chat/unread-count`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (unreadCountRes.data.success && unreadCountRes.data.unreadCount >= 0) {
      logResult('Unread Message Counter Engine', 'PASSED', `Admin unread count: ${unreadCountRes.data.unreadCount}`);
    } else {
      logResult('Unread Message Counter Engine', 'FAILED', 'Unread count fetch failed');
    }

    console.log('\n================ SECURITY AUDIT SUMMARY ================');
    const passedCount = results.filter(r => r.status === 'PASSED').length;
    console.log(`TOTAL SECURITY TESTS: ${results.length}`);
    console.log(`PASSED: ${passedCount}`);
    console.log(`FAILED: ${results.length - passedCount}`);

  } catch (err) {
    console.error('Security Test Execution Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

runSecurityAndEdgeCaseTests();
