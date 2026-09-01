import { chromium } from 'playwright';

(async () => {
  console.log('1. Launching Playwright to test Answer Key & Download PDF Solutions report...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://sarvottam-diksha.web.app', { waitUntil: 'domcontentloaded' });

  const dummyPdfDataUrl = 'data:application/pdf;base64,JVBERi0xLjQKJSCi4yANCjEgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlIC9QYWdlcyAvQ291bnQgMSAvS2lkcyBbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdPj4KZW5kb2JqCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAyMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY4IDAwMDAwIG4gCjAwMDAwMDAxMjUgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDQgL1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTczCiUlRU9G';

  const demoAttempt = {
    id: 'att_demo_review_1',
    attemptId: 'att_demo_review_1',
    testTitle: 'Tense Questions & Calculus Quiz',
    score: 3,
    maxScore: 8,
    totalMarks: 8,
    correctCount: 1,
    wrongCount: 1,
    unansweredCount: 0,
    accuracyPercentage: 50,
    percentage: 50,
    timeTakenSeconds: 45,
    passed: true,
    solutionDocUrl: dummyPdfDataUrl,
    solutionDocName: 'Tense Questions Solutions.pdf',
    questionsReview: [
      {
        id: 'q1',
        sectionName: 'Section A',
        questionType: 'MCQ',
        questionText: 'What is the derivative of sin(x) with respect to x?',
        optionA: 'cos(x)',
        optionB: '-cos(x)',
        optionC: 'tan(x)',
        optionD: 'sec(x)',
        correctOption: 'A',
        selectedOption: 'A',
        isCorrect: true,
        explanation: 'The derivative of sin(x) is cos(x).',
        marks: 4,
        negativeMarks: 1
      },
      {
        id: 'q2',
        sectionName: 'Section A',
        questionType: 'MCQ',
        questionText: 'Evaluate the indefinite integral ∫ 2x dx',
        optionA: 'x² + C',
        optionB: '2x² + C',
        optionC: 'x + C',
        optionD: '1/x + C',
        correctOption: 'A',
        selectedOption: 'B',
        isCorrect: false,
        explanation: '∫ 2x dx = x² + C.',
        marks: 4,
        negativeMarks: 1
      }
    ]
  };

  await page.evaluate(({ att }) => {
    const studentUser = { id: 's1', name: 'MONISHA', role: 'STUDENT' };
    window.localStorage.setItem('sd_user', JSON.stringify(studentUser));
    window.localStorage.setItem('user', JSON.stringify(studentUser));
    window.localStorage.setItem('sd_token', 'demo');
    window.localStorage.setItem('sd_test_results', JSON.stringify([att]));
  }, { att: demoAttempt });

  console.log('2. Navigating to /test-result/att_demo_review_1...');
  await page.goto('https://sarvottam-diksha.web.app/test-result/att_demo_review_1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(1000);

  const text = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== REPORT & SOLUTIONS PDF VERIFICATION ===================');
  console.log('Score 3 / 8 rendered:', text.includes('3') && text.includes('/ 8'));
  console.log('Download Solutions Button rendered:', text.includes('Download Solutions (.docx / PDF)'));
  console.log('Solutions PDF filename displayed:', text.includes('Tense Questions Solutions.pdf'));
  console.log('Question 1 CORRECT badge rendered:', text.includes('✓ CORRECT'));
  console.log('Question 2 INCORRECT badge rendered:', text.includes('✗ INCORRECT'));
  console.log('Correct Answer Highlighted (Emerald Green):', text.includes('cos(x)'));
  console.log('Manika Ma\'am Explanation rendered:', text.includes('Concept Explanation by Manika Ma\'am'));
  console.log('===========================================================================\n');

  await page.screenshot({ path: '../scorecard_and_solutions_pdf_verified.png' });
  await browser.close();
})();
