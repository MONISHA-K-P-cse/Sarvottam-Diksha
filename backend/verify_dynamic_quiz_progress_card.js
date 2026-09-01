import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const studentObj = {
    id: 'student_999',
    name: 'Ananya Sharma',
    email: 'ananya@gmail.com',
    role: 'STUDENT'
  };

  const realAttempt = {
    id: 'att_real_101',
    testId: 'quiz_real_math_1',
    testTitle: 'Class 10 Real Numbers Board Mock Test',
    score: 4,
    totalMarks: 4,
    correctCount: 1,
    wrongCount: 0,
    percentage: 100,
    passed: true,
    timeTakenSeconds: 120
  };

  await context.addInitScript(({ studentObj, realAttempt }) => {
    window.localStorage.setItem('sd_user', JSON.stringify(studentObj));
    window.localStorage.setItem('sd_token', 'demo_student_token');
    window.localStorage.setItem('sd_test_results', JSON.stringify([realAttempt]));
  }, { studentObj, realAttempt });

  const page = await context.newPage();

  console.log('1. Navigating to homepage...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const bodyText = await page.evaluate(() => document.body.innerText);

  console.log('--- BODY TEXT AT HOMEPAGE ---');
  console.log(bodyText.slice(0, 1000));
  console.log('-----------------------------');

  await browser.close();
})();
