import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Loading app and logging into Admin Dashboard...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });

  const customBannerId = 'banner_demo_888';
  await page.evaluate((bId) => {
    localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_1',
      name: 'Admin Educator',
      email: 'admin@diksha.com',
      role: 'ADMIN'
    }));
    localStorage.setItem('sd_token', 'mock_admin_token');

    const customBanner = {
      id: bId,
      title: '🌟 Special Board Revision Batch 2026',
      description: 'Exclusive 30-day intensive crash course with live problem solving!',
      thumbnail: '/assets/poster-flyer.png',
      buttonText: 'Join Crash Course',
      link: '/courses',
      status: 'PUBLISHED'
    };

    const existingBanners = JSON.parse(localStorage.getItem('sd_custom_banners') || '[]');
    localStorage.setItem('sd_custom_banners', JSON.stringify([customBanner, ...existingBanners.filter(b => b.id !== bId)]));
  }, customBannerId);

  console.log('2. Navigating to Admin Dashboard (App Setup -> Manage Banners)...');
  await page.goto('https://sarvottam-diksha.web.app/admin?tab=app&subTab=manage-banners', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const adminText = await page.evaluate(() => document.body.innerText);
  console.log('Admin Dashboard contains uploaded banner title:', adminText.includes('Special Board Revision Batch 2026'));

  console.log('3. Navigating to Student Home Page to check Banner Carousel...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const homeText = await page.evaluate(() => document.body.innerText);
  console.log('\n=================== BANNER DISPLAY VERIFICATION ===================');
  console.log('Student Home Carousel displays banner title:', homeText.includes('Special Board Revision Batch 2026'));
  console.log('Student Home Carousel displays banner description:', homeText.includes('Exclusive 30-day intensive crash course'));
  console.log('Student Home Carousel displays action button:', homeText.includes('Join Crash Course'));
  console.log('===================================================================\n');

  await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/banner_display_verified.png' });
  await browser.close();
})();
