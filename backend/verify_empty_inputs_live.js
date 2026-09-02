import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const portalEl = await page.$('#login-portal');
  if (portalEl) {
    await portalEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await portalEl.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/student_empty_card_verified.png' });

    console.log('Switching to Admin...');
    await page.click('button:has-text("I am Teacher (Admin)")');
    await page.waitForTimeout(500);
    await portalEl.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/admin_empty_card_verified.png' });
  }

  await browser.close();
})();
