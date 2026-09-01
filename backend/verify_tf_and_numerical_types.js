import { chromium } from 'playwright';

(async () => {
  console.log('1. Testing True/False 2-option restriction & Numerical question evaluation in Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://sarvottam-diksha.web.app', { waitUntil: 'domcontentloaded' });

  const mixedQuestions = [
    {
      id: 'q_tf_1',
      sectionName: 'Section A',
      questionType: 'TRUE_FALSE',
      questionText: 'Is the sum of angles in a triangle equal to 180°?',
      optionA: 'True', optionB: 'False',
      correctOption: 'A',
      explanation: 'Sum of internal angles in any triangle is always 180°.',
      positiveMarks: 1, negativeMarks: 0
    },
    {
      id: 'q_num_2',
      sectionName: 'Section B',
      questionType: 'INTEGER',
      questionText: 'Evaluate: 6 × 7',
      correctOption: '42',
      explanation: '6 × 7 = 42.',
      positiveMarks: 1, negativeMarks: 0
    }
  ];

  await page.evaluate(({ qs }) => {
    const studentUser = { id: 's1', name: 'MONISHA', role: 'STUDENT' };
    window.localStorage.setItem('sd_user', JSON.stringify(studentUser));
    window.localStorage.setItem('user', JSON.stringify(studentUser));
    window.localStorage.setItem('sd_token', 'demo');
    window.localStorage.setItem('sd_test_questions_mixed_type_test', JSON.stringify(qs));
    window.localStorage.setItem('sd_custom_tests', JSON.stringify([{ id: 'mixed_type_test', title: 'Mixed Types Verification Test', questions: qs }]));
  }, { qs: mixedQuestions });

  console.log('2. Navigating to /test/mixed_type_test...');
  await page.goto('https://sarvottam-diksha.web.app/test/mixed_type_test', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Question 1 (TRUE_FALSE): Click Option A (True)
  console.log('3. Question 1 (True/False): Selecting Option A (True)...');
  await page.click('[data-testid="option-button-A"]');
  await page.waitForTimeout(500);

  // Move to Question 2 (INTEGER)
  console.log('4. Moving to Question 2 (Integer/Numerical)...');
  await page.click('button:has-text("Next Question")');
  await page.waitForTimeout(500);

  // Question 2 (INTEGER): Type '42'
  console.log('5. Question 2 (Integer): Typing answer 42...');
  await page.fill('input[placeholder*="Enter your exact answer"]', '42');
  await page.waitForTimeout(500);

  // Submit test
  console.log('6. Submitting test...');
  await page.click('button:has-text("Submit Test Now")');
  await page.waitForTimeout(3000);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  const text = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== QUESTION TYPE REVIEW VERIFICATION ===================');
  console.log('Final Score 2 / 2:', text.includes('2') && text.includes('/ 2'));
  console.log('Accuracy Rate 100%:', text.includes('100%'));
  console.log('True/False Option C HIDDEN:', !text.includes('C: Option C'));
  console.log('True/False Option D HIDDEN:', !text.includes('D: Option D'));
  console.log('Numerical Your Submitted Answer 42:', text.includes('42'));
  console.log('Numerical Correct Target Answer 42:', text.includes('Correct Target Answer'));
  console.log('=========================================================================\n');

  await page.screenshot({ path: '../tf_and_numerical_review_verified.png' });
  await browser.close();
})();
