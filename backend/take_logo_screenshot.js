import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '../sidebar_logo_enlarged.png', fullPage: false });

  await browser.close();
})();
