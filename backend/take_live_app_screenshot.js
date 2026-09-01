import { chromium } from 'playwright';

(async () => {
  console.log('1. Launching Playwright to test live site...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('2. Navigating to https://sarvottam-diksha.web.app...');
  await page.goto('https://sarvottam-diksha.web.app', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '../live_app_verified.png' });

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n=================== LIVE WEBSITE STATUS ===================');
  console.log('Contains error:', bodyText.includes('ReferenceError') || bodyText.includes('Something went wrong'));
  console.log('Header text preview:', bodyText.slice(0, 150));
  console.log('===========================================================\n');

  await browser.close();
})();
