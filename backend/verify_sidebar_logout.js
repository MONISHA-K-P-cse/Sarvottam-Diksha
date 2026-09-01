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

  const check = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    const hasSidebarLogout = aside ? Array.from(aside.querySelectorAll('button')).some(btn => btn.innerText.includes('Logout')) : false;

    const nav = document.querySelector('nav');
    const hasTopBarLogout = nav ? Array.from(nav.querySelectorAll('button')).some(btn => btn.innerText.includes('Logout')) : false;

    return { hasSidebarLogout, hasTopBarLogout };
  });

  console.log(`\n=======================================================`);
  console.log(`🚪 SIDEBAR LOGOUT PRESENT: ${check.hasSidebarLogout ? 'YES' : 'NO'}`);
  console.log(`🚫 TOP BAR LOGOUT REMOVED: ${!check.hasTopBarLogout ? 'YES' : 'NO'}`);
  console.log(`=======================================================\n`);

  const screenshotPath = path.join(process.cwd(), 'e2e_test_reports', 'top_bar_logout_removed_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();
})();
