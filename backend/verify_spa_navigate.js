import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.stack || err.message));

  await page.addInitScript(() => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_token');
  });

  console.log('1. Loading Admin Dashboard (https://sarvottam-diksha.web.app/admin)...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('2. Navigating to Courses tab...');
  const coursesSidebarBtn = page.locator('button:has-text("Courses")').first();
  await coursesSidebarBtn.click();
  await page.waitForTimeout(2000);

  console.log('3. Clicking Manage button directly on the course card (excluding Manage Coupons)...');
  const courseCardManageBtn = page.locator('button:has-text("Manage")').filter({ hasNotText: 'Coupons' }).first();
  await courseCardManageBtn.click();
  await page.waitForTimeout(3000);

  const urlAfterClick = page.url();
  const bodyTextAfterClick = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== EXACT E2E LIVE MANAGE CLICK RESULT ===================');
  console.log('Page URL after click:', urlAfterClick);
  console.log('Body Text (first 500 chars):\n', bodyTextAfterClick.substring(0, 500));
  console.log('=========================================================================\n');

  const artifactDir = '/Users/monisha/.gemini/antigravity-ide/brain/96160f44-8e21-49b8-9cea-f7f9be2c34b0';
  const screenshotPath = path.join(artifactDir, 'screenshot_manage_final_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();
})();
