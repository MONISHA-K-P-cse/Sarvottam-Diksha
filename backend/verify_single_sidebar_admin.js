import { chromium } from 'playwright';

(async () => {
  console.log('1. Launching Playwright to test single sidebar on Admin Portal...');
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
  await page.waitForTimeout(2500);

  await page.screenshot({ path: '../single_sidebar_admin_verified.png' });

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n=================== VERIFICATION: SINGLE SIDEBAR ON ADMIN ===================');
  console.log('Contains outer student menu "Math Academy":', bodyText.includes('Math Academy'));
  console.log('Contains Teacher Admin Portal sidebar:', bodyText.includes('TEACHER ADMIN PORTAL') || bodyText.includes('Platform Settings'));
  console.log('=============================================================================\n');

  await browser.close();
})();
