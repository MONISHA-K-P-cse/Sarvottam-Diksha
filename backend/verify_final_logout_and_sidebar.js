import { chromium } from 'playwright';

(async () => {
  console.log('1. Launching Playwright E2E verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const adminUser = {
    id: '88261e1a-5267-4059-bb73-3e9a26585e7f',
    name: 'Manika Maheshwari',
    email: 'Dikshasarvottam@gmail.com',
    role: 'ADMIN'
  };

  await context.addInitScript(({ u, t }) => {
    window.localStorage.setItem('sd_user', JSON.stringify(u));
    window.localStorage.setItem('user', JSON.stringify(u));
    window.localStorage.setItem('sd_token', t);
  }, { u: adminUser, t: 'demo_admin_token' });

  const page = await context.newPage();

  console.log('2. Navigating to Admin Portal (/admin)...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click Logout button in Admin Dashboard sidebar
  console.log('3. Clicking Logout on Admin Portal with force...');
  const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Log Out")').last();
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click({ force: true });
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: '../final_logout_verified.png' });

  const currentUrl = page.url();
  const storedUser = await page.evaluate(() => localStorage.getItem('sd_user'));
  const bodyText = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== VERIFICATION: LOGOUT & SIDEBAR RULES ===================');
  console.log('Current URL after logout:', currentUrl);
  console.log('sd_user cleared from localStorage:', storedUser === null);
  console.log('Homepage does NOT contain sidebar Math Academy:', !bodyText.includes('Math Academy'));
  console.log('============================================================================\n');

  await browser.close();
})();
