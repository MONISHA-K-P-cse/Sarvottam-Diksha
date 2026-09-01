import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Loading live app course page for "lucky"...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });

  // Set up local storage for paid course "lucky" with quiz "abhyaas"
  await page.evaluate(() => {
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

  console.log('2. Navigating to https://sarvottam-diksha.web.app/course/lucky...');
  await page.goto('https://sarvottam-diksha.web.app/course/lucky', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const text = await page.evaluate(() => document.body.innerText);
  console.log('\n=================== LIVE APP VERIFICATION ===================');
  console.log('Includes "Locked (Buy Course to Attempt)":', text.includes('Locked (Buy Course to Attempt)'));
  console.log('Includes "Attempt Quiz Now" (Should be FALSE):', text.includes('Attempt Quiz Now'));
  console.log('Includes "✓ Unlocked" (Should be FALSE):', text.includes('✓ Unlocked'));
  console.log('=============================================================\n');

  await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/live_locked_quiz_verified.png' });
  await browser.close();
})();
