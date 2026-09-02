import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('request', req => {
    if (req.url().includes('identitytoolkit') || req.url().includes('accounts')) {
      console.log('API REQUEST:', req.method(), req.url(), req.postData());
    }
  });

  page.on('response', async res => {
    if (res.url().includes('identitytoolkit') || res.url().includes('accounts')) {
      try {
        const data = await res.json();
        console.log('API RESPONSE STATUS:', res.status(), JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('API RESPONSE STATUS:', res.status());
      }
    }
  });

  console.log('Navigating to live Firebase URL...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const portal = page.locator('#login-portal');
  await portal.scrollIntoViewIfNeeded();

  console.log('Clicking Forgot Password...');
  await portal.locator('button:has-text("Forgot Password?")').click();
  await page.waitForTimeout(500);

  console.log('Typing email and submitting...');
  await portal.locator('input[type="email"]').fill('pmonisha0629@gmail.com');
  await portal.locator('button:has-text("Send Password Reset Email")').click();
  await page.waitForTimeout(4000);

  await browser.close();
})();
