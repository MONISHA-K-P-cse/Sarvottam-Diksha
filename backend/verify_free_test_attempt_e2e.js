import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Loading app and configuring Free Test...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });

  const freeTestId = 'demo_free_test_999';
  await page.evaluate((tId) => {
    localStorage.setItem('sd_user', JSON.stringify({
      id: 'student_456',
      name: 'Free Test Student',
      email: 'student_free@example.com',
      role: 'STUDENT'
    }));
    localStorage.setItem('sd_token', 'mock_free_student_token');

    const freeTestObj = {
      id: tId,
      title: 'Class 10 Trigonometry Free Mock Test',
      category: '#FreeTest, #TRIGONOMETRY',
      isFreeTest: true,
      accessMode: 'FREE',
      price: 0,
      durationMinutes: 30,
      totalMarks: 40,
      questionCount: 2,
      questions: [
        { id: 'q1', text: 'What is sin(90°)?', options: ['0', '1', '1/2', 'Undefined'], correctAnswer: '1', marks: 4 },
        { id: 'q2', text: 'What is cos(0°)?', options: ['0', '1', '1/2', 'Undefined'], correctAnswer: '1', marks: 4 }
      ]
    };

    const storedFree = JSON.parse(localStorage.getItem('sd_free_tests') || '[]');
    localStorage.setItem('sd_free_tests', JSON.stringify([freeTestObj, ...storedFree.filter(t => t.id !== tId)]));

    const storedCustom = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
    localStorage.setItem('sd_custom_tests', JSON.stringify([freeTestObj, ...storedCustom.filter(t => t.id !== tId)]));
  }, freeTestId);

  console.log('2. Navigating to Free Tests page...');
  await page.goto('https://sarvottam-diksha.web.app/free-resources', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const freePageText = await page.evaluate(() => document.body.innerText);
  console.log('Free Tests Page contains test title:', freePageText.includes('Class 10 Trigonometry Free Mock Test'));
  console.log('Free Tests Page contains "START TEST NOW":', freePageText.includes('START TEST NOW'));

  console.log('3. Launching Test Engine for Free Test...');
  await page.goto(`https://sarvottam-diksha.web.app/test/${freeTestId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const testEngineText = await page.evaluate(() => document.body.innerText);
  console.log('\n=================== FREE TEST ENGINE VERIFICATION ===================');
  console.log('Test Engine Title visible:', testEngineText.includes('Class 10 Trigonometry Free Mock Test'));
  console.log('Access Denied visible (Should be FALSE):', testEngineText.includes('Access Denied'));
  console.log('Questions or Instructions visible:', testEngineText.includes('Instructions') || testEngineText.includes('Trigonometry') || testEngineText.includes('Questions'));
  console.log('=====================================================================\n');

  await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/free_test_attempt_verified.png' });
  await browser.close();
})();
