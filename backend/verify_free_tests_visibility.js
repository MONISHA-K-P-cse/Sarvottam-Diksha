import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addInitScript(() => {
    const studentUser = {
      id: 'student_monisha_777',
      name: 'Monisha K P',
      email: 'monisha@gmail.com',
      role: 'STUDENT'
    };
    window.localStorage.setItem('sd_user', JSON.stringify(studentUser));
    window.localStorage.setItem('user', JSON.stringify(studentUser));
    window.localStorage.setItem('sd_token', 'demo_student_token');

    // Add a custom free quiz added by admin
    const adminFreeQuiz = {
      id: 'admin_free_test_99',
      title: 'Class 10 Polynomials Free Practice Series',
      accessMode: 'FREE',
      price: 0,
      isFreeTest: true,
      durationMinutes: 45,
      totalMarks: 50,
      questionCount: 15,
      isUnlocked: true,
      questions: [
        { id: 'q1', questionText: 'What is the degree of a quadratic polynomial?', optionA: '1', optionB: '2', optionC: '3', optionD: '4', correctOption: 'B' }
      ]
    };

    window.localStorage.setItem('sd_custom_tests', JSON.stringify([adminFreeQuiz]));
  });

  const page = await context.newPage();
  console.log('1. Navigating to Free Tests Page (/free-test)...');
  await page.goto('https://sarvottam-diksha.web.app/free-test', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const pageContent = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== VERIFICATION: FREE TESTS VISIBILITY ===================');
  console.log('Page Title Present:', pageContent.includes('Practice Tests & Question Bank'));
  console.log('Free Tests Tab Selected:', pageContent.includes('FREE TESTS'));
  console.log('Admin Quiz Visible ("Class 10 Polynomials Free Practice Series"):', pageContent.includes('Class 10 Polynomials Free Practice Series'));
  console.log('Contains "START TEST NOW" button:', pageContent.includes('START TEST NOW'));
  console.log('===========================================================================\n');

  console.log('2. Taking verification screenshot of Free Tests Page...');
  await page.screenshot({ path: '../free_tests_page_verified.png', fullPage: false });

  await browser.close();
})();
