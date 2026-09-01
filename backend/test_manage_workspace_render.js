import { chromium } from 'playwright';

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

  console.log('1. Navigating directly to https://sarvottam-diksha.web.app/admin/courses/c1/manage...');
  await page.goto('https://sarvottam-diksha.web.app/admin/courses/c1/manage', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const url1 = page.url();
  const text1 = await page.evaluate(() => document.body.innerText);

  console.log('\n--- c1 MANAGE WORKSPACE ---');
  console.log('URL:', url1);
  console.log('Header / Workspace Title:', text1.substring(0, 400));

  console.log('\n2. Navigating directly to https://sarvottam-diksha.web.app/admin/courses/c2/manage...');
  await page.goto('https://sarvottam-diksha.web.app/admin/courses/c2/manage', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const url2 = page.url();
  const text2 = await page.evaluate(() => document.body.innerText);

  console.log('\n--- c2 MANAGE WORKSPACE ---');
  console.log('URL:', url2);
  console.log('Header / Workspace Title:', text2.substring(0, 400));

  await browser.close();
})();
