import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_token');
  });

  console.log('Testing Course Detail page for c1...');
  await page.goto('https://sarvottam-diksha.web.app/admin/courses/c1/preview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const text = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== VERIFICATION: CLEAN COURSE DETAILS ===================');
  console.log('Contains fake Chapter 1 Real Numbers:', text.includes('Real Numbers'));
  console.log('Contains fake Polynomials:', text.includes('Polynomials'));
  console.log('Contains hardcoded MATHEMATICS BATCH:', text.includes('• MATHEMATICS BATCH'));
  console.log('\nPage content sample:\n', text.substring(0, 500));
  console.log('========================================================================\n');

  await browser.close();
})();
