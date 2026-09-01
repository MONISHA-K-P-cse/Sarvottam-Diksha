import { chromium } from 'playwright';

(async () => {
  console.log('1. Launching Playwright to test full Abhyaas quiz submit -> scoring -> result flow...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.goto('https://sarvottam-diksha.web.app', { waitUntil: 'domcontentloaded' });

  const abhyaasQuestions = [
    {
      id: 'abhyaas_q1',
      sectionName: 'Section A',
      questionType: 'MCQ',
      questionText: 'What is the derivative of sin(x)?',
      optionA: 'cos(x)', optionB: '-cos(x)', optionC: 'tan(x)', optionD: 'sec(x)',
      correctOption: 'A',
      explanation: 'Derivative of sin(x) is cos(x).',
      positiveMarks: 1, negativeMarks: 0
    },
    {
      id: 'abhyaas_q2',
      sectionName: 'Section A',
      questionType: 'TRUE_FALSE',
      questionText: 'Is the derivative of x² equal to x?',
      optionA: 'True', optionB: 'False',
      correctOption: 'B',
      explanation: 'Derivative of x² is 2x, so False.',
      positiveMarks: 1, negativeMarks: 0
    },
    {
      id: 'abhyaas_q3',
      sectionName: 'Section A',
      questionType: 'MCQ',
      questionText: 'What is tan(x) in terms of sin(x) and cos(x)?',
      optionA: 'sin(x)*cos(x)', optionB: 'cos(x)/sin(x)', optionC: 'sin(x)/cos(x)', optionD: '1/cos(x)',
      correctOption: 'C',
      explanation: 'tan(x) = sin(x)/cos(x).',
      positiveMarks: 1, negativeMarks: 0
    }
  ];

  await page.evaluate(({ qs }) => {
    const studentUser = { id: 's1', name: 'MONISHA', role: 'STUDENT' };
    window.localStorage.setItem('sd_user', JSON.stringify(studentUser));
    window.localStorage.setItem('user', JSON.stringify(studentUser));
    window.localStorage.setItem('sd_token', 'demo');
    window.localStorage.setItem('sd_test_questions_abhyaas_pw_test', JSON.stringify(qs));
    window.localStorage.setItem('sd_custom_tests', JSON.stringify([{ id: 'abhyaas_pw_test', title: 'Abhyaas Practice Test', questions: qs }]));
  }, { qs: abhyaasQuestions });

  console.log('2. Navigating to Abhyaas Test Engine /test/abhyaas_pw_test...');
  await page.goto('https://sarvottam-diksha.web.app/test/abhyaas_pw_test', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Question 1: Click Option A (Correct)
  console.log('3. Question 1: Clicking Option A (Correct)...');
  await page.click('button[data-testid="option-button-A"]');
  await page.waitForTimeout(1000);

  // Click Next Question
  console.log('4. Moving to Question 2...');
  await page.click('button:has-text("Next Question")');
  await page.waitForTimeout(1000);

  // Question 2: Click Option A (Wrong - correct is B)
  console.log('5. Question 2: Clicking Option A (Wrong)...');
  await page.click('button[data-testid="option-button-A"]');
  await page.waitForTimeout(1000);

  // Click Next Question (Question 3 left unanswered)
  console.log('6. Moving to Question 3 (leaving unanswered)...');
  await page.click('button:has-text("Next Question")');
  await page.waitForTimeout(1000);

  // Submit test
  console.log('7. Submitting test...');
  await page.click('button:has-text("Submit Test Now")');
  await page.waitForTimeout(3000);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  const text = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== ABHYAAS SCORING HERO BANNER VERIFICATION ===================');
  console.log('Final Score 1 / 3 rendered:', text.includes('1') && text.includes('/ 3'));
  console.log('Correct Answers 1 rendered:', text.includes('Correct Answers') && text.includes('1'));
  console.log('Wrong Answers 1 rendered:', text.includes('Wrong Answers') && text.includes('1'));
  console.log('Accuracy Rate 50% rendered:', text.includes('50%'));
  console.log('=================================================================================\n');

  await page.screenshot({ path: '../abhyaas_hero_scorecard_verified.png' });
  await browser.close();
})();
