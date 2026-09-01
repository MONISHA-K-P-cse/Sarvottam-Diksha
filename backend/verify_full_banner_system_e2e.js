import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to https://sarvottam-diksha.web.app...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });

  console.log('2. Setting up published banners with date scheduling...');
  await page.evaluate(() => {
    localStorage.setItem('sd_user', JSON.stringify({
      id: 'student_888',
      name: 'Monisha',
      email: 'monisha@example.com',
      role: 'STUDENT'
    }));
    localStorage.setItem('sd_token', 'mock_student_token');

    const activePublishedBanner = {
      id: 'banner_active_1',
      title: '🌟 CLASS 10 & 12 BOARD REVISION CRASH COURSE 2026',
      description: 'Exclusive 30-day intensive Board Exam Problem Solving with Manika Ma\'am',
      thumbnail: '/assets/poster-flyer.png',
      startDate: '2026-01-01T00:00',
      endDate: '2026-12-31T23:59',
      status: 'PUBLISHED',
      buttonText: 'Enroll Crash Course',
      link: '/courses',
      isFeatured: true
    };

    const expiredBanner = {
      id: 'banner_expired_9',
      title: '⛔ OLD EXPIRED BANNER (SHOULD NOT APPEAR)',
      description: 'This banner should automatically disappear because end date passed',
      thumbnail: '/assets/results-2023.png',
      startDate: '2020-01-01T00:00',
      endDate: '2023-01-01T00:00',
      status: 'PUBLISHED',
      buttonText: 'Old Link',
      link: '/courses',
      isFeatured: false
    };

    const unpublishedBanner = {
      id: 'banner_unpublished_4',
      title: '🔴 UNPUBLISHED DRAFT BANNER (SHOULD NOT APPEAR)',
      description: 'This banner is unpublished',
      thumbnail: '/assets/results-2024.png',
      status: 'UNPUBLISHED',
      buttonText: 'Draft',
      link: '/courses',
      isFeatured: false
    };

    localStorage.setItem('sd_custom_banners', JSON.stringify([
      activePublishedBanner,
      expiredBanner,
      unpublishedBanner
    ]));
  });

  console.log('3. Navigating to Student Portal Home...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const homeText = await page.evaluate(() => document.body.innerText);
  console.log('\n=================== FULL BANNER SYSTEM VERIFICATION ===================');
  console.log('Welcome back card at top:', homeText.includes('Welcome back, Monisha'));
  console.log('Latest Banners header visible:', homeText.includes('Latest Banners & Academy Highlights'));
  console.log('Active Published banner visible:', homeText.includes('CLASS 10 & 12 BOARD REVISION CRASH COURSE 2026'));
  console.log('Expired banner correctly filtered out:', !homeText.includes('OLD EXPIRED BANNER'));
  console.log('Unpublished banner correctly filtered out:', !homeText.includes('UNPUBLISHED DRAFT BANNER'));
  console.log('Button text visible:', homeText.includes('Enroll Crash Course'));
  console.log('========================================================================\n');

  await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/full_banner_system_verified.png' });
  await browser.close();
})();
