import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.addInitScript(() => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_jwt');
  });

  console.log('1. Opening Admin Dashboard...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  console.log('2. Clicking "Content" in Sidebar...');
  const contentBtn = page.locator('button:has-text("Content")').first();
  await contentBtn.click();
  await page.waitForTimeout(1500);

  const text = await page.evaluate(() => document.body.innerText);
  const hasError = text.includes('ReferenceError') || text.includes('Something went wrong');
  const hasContentPage = text.includes('Test Portal') || text.includes('Search online tests');

  console.log(`\n=======================================================`);
  console.log(`📂 ADMIN SIDEBAR CONTENT TAB CLICK VERIFICATION: ${!hasError && hasContentPage ? 'SUCCESS - NO REFERENCE ERROR!' : 'FAILED'}`);
  console.log(`=======================================================\n`);

  const screenshotPath = path.join(process.cwd(), 'e2e_test_reports', 'admin_content_tab_click_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();
})();
