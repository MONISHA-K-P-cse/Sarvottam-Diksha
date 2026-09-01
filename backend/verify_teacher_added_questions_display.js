import { chromium } from 'playwright';

(async () => {
  console.log("1. Launching Playwright to test display of teacher's exact added questions...");
  const browser = await chromium.launch({ headless: true });

  const studentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await studentContext.newPage();

  // First open site to establish origin
  await page.goto('https://sarvottam-diksha.web.app', { waitUntil: 'domcontentloaded' });

  const customTeacherQuestions = [
    {
      id: 'custom_q1',
      sectionName: 'Section A',
      questionType: 'MCQ',
      questionText: 'What is the derivative of sin(x) with respect to x?',
      options: ['cos(x)', '-cos(x)', 'tan(x)', 'sec(x)'],
      optionA: 'cos(x)',
      optionB: '-cos(x)',
      optionC: 'tan(x)',
      optionD: 'sec(x)',
      correctOption: 'A',
      explanation: 'The derivative of sin(x) is cos(x).',
      positiveMarks: 4,
      negativeMarks: 1
    },
    {
      id: 'custom_q2',
      sectionName: 'Section A',
      questionType: 'MCQ',
      questionText: 'Evaluate the indefinite integral ∫ 2x dx',
      options: ['x² + C', '2x² + C', 'x + C', '1/x + C'],
      optionA: 'x² + C',
      optionB: '2x² + C',
      optionC: 'x + C',
      optionD: '1/x + C',
      correctOption: 'A',
      explanation: '∫ 2x dx = 2(x²/2) + C = x² + C.',
      positiveMarks: 4,
      negativeMarks: 1
    }
  ];

  await page.evaluate(({ qs }) => {
    const studentUser = {
      id: 'student_monisha_gmail_com',
      name: 'MONISHA',
      email: 'monisha@gmail.com',
      role: 'STUDENT'
    };
    window.localStorage.setItem('sd_user', JSON.stringify(studentUser));
    window.localStorage.setItem('user', JSON.stringify(studentUser));
    window.localStorage.setItem('sd_token', 'demo_token');

    const testId = 'teacher_custom_quiz_1';
    window.localStorage.setItem(`sd_test_questions_${testId}`, JSON.stringify(qs));
    window.localStorage.setItem('sd_custom_tests', JSON.stringify([
      {
        id: testId,
        title: 'Calculus Chapterwise Quiz',
        questions: qs,
        questionsCount: qs.length
      }
    ]));
  }, { qs: customTeacherQuestions });

  console.log('2. Navigating to course quiz /test/teacher_custom_quiz_1...');
  await page.goto('https://sarvottam-diksha.web.app/test/teacher_custom_quiz_1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const textInTest = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== TEACHER QUESTIONS VERIFICATION ===================');
  console.log("Teacher's exact Question 1 rendered:", textInTest.includes('derivative of sin(x)'));
  console.log("Teacher's exact Option A (cos(x)) rendered:", textInTest.includes('cos(x)'));
  console.log("Sample fallback questions NOT used:", !textInTest.includes('Solve for x: 3x + 12 = 27'));
  console.log('======================================================================\n');

  await page.screenshot({ path: '../teacher_custom_questions_verified.png' });

  await browser.close();
})();
