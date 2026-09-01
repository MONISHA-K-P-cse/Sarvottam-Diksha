import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const API_BASE = 'http://localhost:5001/api';
const prisma = new PrismaClient();

async function runTimerPersistenceTests() {
  console.log('============== ACTIVE TEST TIMER PERSISTENCE TEST ==============\n');
  const results = [];

  const logResult = (testName, status, detail = '') => {
    const icon = status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} [${status}] ${testName}${detail ? ' - ' + detail : ''}`);
    results.push({ testName, status, detail });
  };

  try {
    // 1. Create Student & Fetch Test
    const studentEmail = `timer_student_${Date.now()}@gmail.com`;
    const reg = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Timer Test Student',
      email: studentEmail,
      phone: '9777766665',
      password: 'password123'
    });
    const token = reg.data.token;
    const userId = reg.data.user.id;

    const test = await prisma.test.findFirst({
      include: { questions: true }
    });

    if (!test) {
      console.error('No test found in DB to test timer persistence.');
      return;
    }

    console.log(`Testing with Test: "${test.title}" (ID: ${test.id}), Duration: ${test.durationMinutes} Mins`);

    // TEST 1: Start Test & Check Initial Remaining Time
    const startRes1 = await axios.post(
      `${API_BASE}/tests/${test.id}/start`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const initialSecs = startRes1.data.session.remainingSeconds;
    if (startRes1.data.success && initialSecs > 0) {
      logResult('Initial Test Start', 'PASSED', `Started with ${initialSecs}s remaining`);
    } else {
      logResult('Initial Test Start', 'FAILED', 'Could not start test session');
    }

    // TEST 2: Simulate Browser Refresh after 3 Seconds Wait
    console.log('Waiting 3 seconds to simulate student working on test...');
    await new Promise(r => setTimeout(r, 3000));

    const refreshRes = await axios.post(
      `${API_BASE}/tests/${test.id}/start`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const refreshedSecs = refreshRes.data.session.remainingSeconds;

    if (refreshedSecs <= initialSecs - 2 && refreshedSecs > 0) {
      logResult(
        'Browser Refresh Timer Persistence',
        'PASSED',
        `Timer DID NOT reset! Decreased from ${initialSecs}s to ${refreshedSecs}s (elapsed ~3s)`
      );
    } else {
      logResult(
        'Browser Refresh Timer Persistence',
        'FAILED',
        `Timer reset or invalid: initial=${initialSecs}s, refreshed=${refreshedSecs}s`
      );
    }

    // TEST 3: Save Intermediate Answer & Refresh to Check Persistence
    const firstQ = test.questions[0];
    if (firstQ) {
      await axios.post(
        `${API_BASE}/tests/${test.id}/save-progress`,
        { userAnswers: { [firstQ.id]: 'B' }, flagged: { [firstQ.id]: true } },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const restoreRes = await axios.post(
        `${API_BASE}/tests/${test.id}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const savedAns = restoreRes.data.session.savedAnswers;
      const savedFlag = restoreRes.data.session.savedFlagged;

      if (savedAns[firstQ.id] === 'B' && savedFlag[firstQ.id] === true) {
        logResult('Mid-Test Answer & Flag Persistence on Refresh', 'PASSED', 'Restored option B and flagged state on refresh');
      } else {
        logResult('Mid-Test Answer & Flag Persistence on Refresh', 'FAILED', 'Progress was lost on refresh');
      }
    }

    // TEST 4: Expiration Handling
    // Force active session expiry in DB to simulate time running out while browser was closed
    await prisma.activeTestSession.update({
      where: { userId_testId: { userId, testId: test.id } },
      data: { expiresAt: new Date(Date.now() - 5000) }
    });

    const expiredCheck = await axios.post(
      `${API_BASE}/tests/${test.id}/start`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (expiredCheck.data.session?.expired) {
      logResult('Expiry Detection on Refresh/Reopen', 'PASSED', 'Detected expired session and triggered auto-submit flag');
    } else {
      logResult('Expiry Detection on Refresh/Reopen', 'FAILED', 'Did not mark session as expired');
    }

    // Cleanup session
    await prisma.activeTestSession.deleteMany({
      where: { userId, testId: test.id }
    });

    console.log('\n================ TIMER PERSISTENCE SUMMARY ================');
    const passedCount = results.filter(r => r.status === 'PASSED').length;
    console.log(`TOTAL TIMER TESTS: ${results.length}`);
    console.log(`PASSED: ${passedCount}`);
    console.log(`FAILED: ${results.length - passedCount}`);

  } catch (err) {
    console.error('Timer Persistence Test Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTimerPersistenceTests();
