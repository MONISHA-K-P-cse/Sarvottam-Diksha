import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to https://sarvottam-diksha.web.app...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });

  console.log('2. Setting student user session...');
  await page.evaluate(() => {
    localStorage.setItem('sd_user', JSON.stringify({
      id: 'student_123',
      name: 'Test Student',
      email: 'student@example.com',
      role: 'STUDENT'
    }));
    localStorage.setItem('sd_token', 'mock_student_token');
    localStorage.removeItem('sd_enrolled_courses');

    const luckyCourse = {
      id: 'lucky',
      title: 'lucky',
      price: 850,
      gstAmount: 27,
      handlingFee: 14,
      category: 'CLASS 8 MATHEMATICS',
      description: 'maths class 8',
      attachedQuizzes: [{ id: 'abhyaas', title: 'abhyaas', durationMinutes: 160, totalMarks: 100, questionCount: 4 }]
    };
    localStorage.setItem('sd_custom_courses', JSON.stringify([luckyCourse]));
  });

  console.log('3. Navigating to https://sarvottam-diksha.web.app/course/lucky...');
  await page.goto('https://sarvottam-diksha.web.app/course/lucky', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const text = await page.evaluate(() => document.body.innerText);
  console.log('\n=================== LOGGED IN STUDENT COURSE PAGE ===================');
  console.log('Includes "Locked (Buy Course to Attempt)":', text.includes('Locked (Buy Course to Attempt)'));
  console.log('Includes "Attempt Quiz Now" (Should be FALSE):', text.includes('Attempt Quiz Now'));
  console.log('Includes "✓ Unlocked" (Should be FALSE):', text.includes('✓ Unlocked'));
  console.log('Includes "Buy Now – ₹ 901":', text.includes('Buy Now'));
  console.log('=====================================================================\n');

  await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/student_lucky_page.png' });
  await browser.close();
})();
