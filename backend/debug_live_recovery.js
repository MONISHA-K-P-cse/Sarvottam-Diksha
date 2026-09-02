import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText));
  page.on('response', res => {
    if (res.status() >= 400) {
      console.log('HTTP ERROR RESPONSE:', res.status(), res.url());
    }
  });

  console.log('Loading live site...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const portal = page.locator('#login-portal');
  await portal.scrollIntoViewIfNeeded();

  console.log('Clicking Forgot Password...');
  await portal.locator('button:has-text("Forgot Password?")').click();
  await page.waitForTimeout(500);

  console.log('Submitting email pmonisha0629@gmail.com...');
  await portal.locator('input[type="email"]').fill('pmonisha0629@gmail.com');
  await portal.locator('button:has-text("Send Password Reset Email")').click();
  await page.waitForTimeout(4000);

  const portalText = await portal.innerText();
  console.log('Portal text after submit:\n', portalText);

  await browser.close();
})();
