import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to https://sarvottam-diksha.web.app...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });

  console.log('2. Setting up published custom banner matching Image 2...');
  await page.evaluate(() => {
    localStorage.setItem('sd_user', JSON.stringify({
      id: 'student_999',
      name: 'Monisha',
      email: 'monisha@example.com',
      role: 'STUDENT'
    }));
    localStorage.setItem('sd_token', 'mock_student_token');

    const geometryBanner = {
      id: 'banner_geometry_easy',
      title: 'Geometry Made Easy!',
      description: 'Understand theorems visually. Learn better. Score higher.',
      thumbnail: '/assets/poster-flyer.png',
      status: 'PUBLISHED',
      buttonText: 'Explore Now',
      link: '/courses',
      isFeatured: true
    };

    localStorage.setItem('sd_custom_banners', JSON.stringify([geometryBanner]));
  });

  console.log('3. Navigating to Student Portal Home...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const homeText = await page.evaluate(() => document.body.innerText);
  console.log('\n=================== IMAGE 2 SPLIT CARD VERIFICATION ===================');
  console.log('Title Geometry Made Easy visible:', homeText.includes('Geometry Made Easy!'));
  console.log('Subtitle Understand theorems visually visible:', homeText.includes('Understand theorems visually'));
  console.log('Featured Banner badge visible:', homeText.includes('FEATURED BANNER'));
  console.log('Explore Now button visible:', homeText.includes('Explore Now'));
  console.log('=======================================================================\n');

  await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/exact_image2_split_card_verified.png' });
  await browser.close();
})();
