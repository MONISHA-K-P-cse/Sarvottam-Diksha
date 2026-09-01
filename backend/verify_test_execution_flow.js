import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const quizId = 'demo_attemptable_quiz_999';
  const demoQuiz = {
    id: quizId,
    title: 'Mathematics Chapter 1 Full Mock Test',
    durationMinutes: 20,
    totalMarks: 4,
    questions: [
      {
        id: 'q1',
        questionText: 'What is the value of 15 * 4?',
        options: ['60', '50', '40', '30'],
        correctIndex: 0,
        positiveMarks: 4,
        negativeMarks: 1
      }
    ]
  };

  const studentObj = {
    id: 'student_999',
    name: 'Ananya Sharma',
    email: 'ananya@gmail.com',
    role: 'STUDENT'
  };

  await context.addInitScript(({ quizId, demoQuiz, studentObj }) => {
    window.localStorage.setItem('sd_user', JSON.stringify(studentObj));
    window.localStorage.setItem('sd_custom_tests', JSON.stringify([demoQuiz]));
  }, { quizId, demoQuiz, studentObj });

  const page = await context.newPage();

  console.log('1. Opening Test Engine at /test/' + quizId + '...');
  await page.goto(`https://sarvottam-diksha.web.app/test/${quizId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const engineText = await page.evaluate(() => document.body.innerText);
  console.log('--- BODY TEXT AT TEST ENGINE PAGE ---');
  console.log(engineText);
  console.log('------------------------------------');

  await browser.close();
})();
