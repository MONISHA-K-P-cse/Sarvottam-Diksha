import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to https://sarvottam-diksha.web.app...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });

  console.log('2. Setting up published custom banner and student session...');
  await page.evaluate(() => {
    localStorage.setItem('sd_user', JSON.stringify({
      id: 'student_777',
      name: 'Monisha',
      email: 'monisha@example.com',
      role: 'STUDENT'
    }));
    localStorage.setItem('sd_token', 'mock_student_token');

    const publishedBanner = {
      id: 'banner_top_hero_1',
      title: '🌟 CLASS 10 & 12 SPECIAL MATHEMATICS CRASH COURSE 2026',
      description: 'Join Manika Ma\'am for 30 days intensive Board Exam Problem Solving & Live Doubt Clearing!',
      thumbnail: '/assets/poster-flyer.png',
      buttonText: 'Explore Special Batch',
      link: '/courses',
      status: 'PUBLISHED'
    };

    localStorage.setItem('sd_custom_banners', JSON.stringify([publishedBanner]));
  });

  console.log('3. Navigating to Student Portal Home...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const homeText = await page.evaluate(() => document.body.innerText);
  console.log('\n=================== TOP BANNER HERO VERIFICATION ===================');
  console.log('Very top banner title visible:', homeText.includes('CLASS 10 & 12 SPECIAL MATHEMATICS CRASH COURSE 2026'));
  console.log('Banner announcement badge visible:', homeText.includes('LATEST ACADEMY ANNOUNCEMENT'));
  console.log('CTA Button visible:', homeText.includes('Explore Special Batch'));
  console.log('===================================================================\n');

  await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/top_banner_hero_verified.png' });
  await browser.close();
})();
