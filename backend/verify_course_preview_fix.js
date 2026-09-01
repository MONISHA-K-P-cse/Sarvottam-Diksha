import { chromium } from 'playwright';

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

  await page.goto('https://sarvottam-diksha.web.app/courses/course_demo_1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const text = await page.evaluate(() => document.body.innerText);
  console.log('--- FULL PAGE TEXT ON COURSE DETAIL PAGE ---');
  console.log(text);

  await browser.close();
})();
