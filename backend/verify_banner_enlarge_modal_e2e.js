import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to https://sarvottam-diksha.web.app...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });

  await page.evaluate(() => {
    localStorage.setItem('sd_user', JSON.stringify({
      id: 'std_demo_101',
      name: 'Monisha K P',
      email: 'monisha@sarvottamdiksha.com',
      role: 'STUDENT',
      phone: '9876543210'
    }));
    localStorage.setItem('sd_token', 'demo_token');
  });

  console.log('2. Reloading student dashboard...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  console.log('3. Clicking on banner image container...');
  const bannerImg = await page.$('.banner-zoom-trigger img');
  if (bannerImg) {
    console.log('Clicking banner image element!');
    await bannerImg.click();
    await page.waitForTimeout(1500);

    const modalText = await page.evaluate(() => document.body.innerText);
    console.log('\n=================== BANNER ZOOM LIGHTBOX VERIFICATION ===================');
    console.log('Lightbox active (High resolution text visible):', modalText.includes('High resolution banner image preview'));
    console.log('Close button visible:', modalText.includes('Click X or anywhere outside to close'));
    console.log('=========================================================================\n');

    await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/banner_zoom_lightbox_verified.png' });
  } else {
    console.log('ERROR: .banner-zoom-trigger img NOT FOUND');
    await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/debug_no_img.png' });
  }

  await browser.close();
})();
