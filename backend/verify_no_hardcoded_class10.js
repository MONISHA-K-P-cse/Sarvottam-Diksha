import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to homepage...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const bodyText = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== VERIFICATION: INCLUSIVE CLASS 6-12 HEADER ===================');
  console.log('Contains Hardcoded "Class 10 Board Higher Mathematics":', bodyText.includes('Class 10 Board Higher Mathematics'));
  console.log('Contains Inclusive "Classes 6–12 Board & Higher Mathematics":', bodyText.includes('Classes 6–12 Board & Higher Mathematics'));
  console.log('=================================================================================\n');

  await browser.close();
})();
