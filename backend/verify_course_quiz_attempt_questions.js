import { chromium } from 'playwright';

(async () => {
  console.log('1. Launching Playwright to test course quiz question rendering & test engine attempt...');
  const browser = await chromium.launch({ headless: true });

  const studentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const studentUser = {
    id: 'student_monisha_gmail_com',
    name: 'MONISHA',
    email: 'monisha@gmail.com',
    role: 'STUDENT'
  };

  await studentContext.addInitScript(({ u, t }) => {
    window.localStorage.setItem('sd_user', JSON.stringify(u));
    window.localStorage.setItem('user', JSON.stringify(u));
    window.localStorage.setItem('sd_token', t);
  }, { u: studentUser, t: 'demo_token' });

  const page = await studentContext.newPage();
  console.log('2. Navigating to course quiz /test/quiz_course_test_1...');
  await page.goto('https://sarvottam-diksha.web.app/test/quiz_course_test_1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const textInTest = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== QUIZ ATTEMPT VERIFICATION ===================');
  console.log('No questions warning displayed:', textInTest.includes('No questions available in this test'));
  console.log('Question 1 rendered:', textInTest.includes('Question 1 of'));
  console.log('Options / Question text visible:', textInTest.includes('Option A') || textInTest.includes('Solve for x') || textInTest.includes('Section A'));
  console.log('=================================================================\n');

  await page.screenshot({ path: '../course_quiz_attempt_verified.png' });

  await browser.close();
})();
