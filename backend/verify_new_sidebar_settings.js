import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

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

  console.log('2. Verifying Faculty Profile Settings Sidebar Button...');
  const facultyBtn = page.locator('button:has-text("Faculty Profile Settings")').first();
  await facultyBtn.click();
  await page.waitForTimeout(1000);
  const facultyTabVisible = await page.locator('h2:has-text("Faculty Profile Settings")').isVisible();

  console.log('3. Verifying Platform Settings Sidebar Button...');
  const platformBtn = page.locator('button:has-text("Platform Settings")').first();
  await platformBtn.click();
  await page.waitForTimeout(1000);
  const platformTabVisible = await page.locator('h2:has-text("Platform & Organization Settings")').isVisible();

  console.log(`\n=======================================================`);
  console.log(`👤 FACULTY PROFILE SETTINGS TAB: ${facultyTabVisible ? 'SUCCESS - WORKING!' : 'FAILED'}`);
  console.log(`⚙️ PLATFORM SETTINGS TAB: ${platformTabVisible ? 'SUCCESS - WORKING!' : 'FAILED'}`);
  console.log(`=======================================================\n`);

  const screenshotPath = path.join(process.cwd(), 'e2e_test_reports', 'sidebar_settings_tabs_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();
})();
