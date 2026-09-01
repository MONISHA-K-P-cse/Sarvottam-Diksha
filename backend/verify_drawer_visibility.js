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

  console.log('2. Clicking Top Navbar Menu Button...');
  const menuBtn = page.locator('button[title="Open Navigation Menu"]').first();
  if (await menuBtn.isVisible()) {
    await menuBtn.click({ force: true });
    await page.waitForTimeout(1500);
  }

  const drawerState = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasHeader = text.includes('ADMIN CONTROL MENU');
    const hasAdminCenter = text.includes('Admin Command Center');
    return { hasHeader, hasAdminCenter };
  });

  console.log(`\n=======================================================`);
  console.log(`🛡️ ADMIN CONTROL MENU DRAWER VISIBILITY: ${drawerState.hasHeader && drawerState.hasAdminCenter ? 'SUCCESS - CLEAN 100% VISIBILITY!' : 'FAILED'}`);
  console.log(`=======================================================\n`);

  const screenshotPath = path.join(process.cwd(), 'e2e_test_reports', 'admin_drawer_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();
})();
