import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to https://sarvottam-diksha.web.app...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });

  // Clear any existing localStorage
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('2. Filling email and clicking Forgot Password?...');
  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    await emailInput.fill('monisha@gmail.com');
  }

  const forgotBtn = await page.$('button:has-text("Forgot Password?")');
  if (forgotBtn) {
    console.log('Clicking "Forgot Password?" button...');
    await forgotBtn.click();
    await page.waitForTimeout(2000);
  }

  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('\n=================== FORGOT PASSWORD LIVE FLOW VERIFICATION ===================');
  console.log('Reset link generated message visible:', pageText.includes('Password reset link') || pageText.includes('monisha@gmail.com'));
  console.log('Click to Reset Password Now button visible:', pageText.includes('Click to Reset Password Now'));
  console.log('===============================================================================\n');

  await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/forgot_password_live_verified.png' });

  // Check if link exists
  const resetLinkEl = await page.$('a[href*="/reset-password"]');
  if (resetLinkEl) {
    const href = await resetLinkEl.getAttribute('href');
    console.log('Found reset password link URL:', href);
    await page.goto(href, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const resetPageText = await page.evaluate(() => document.body.innerText);
    console.log('Reset Password page title visible:', resetPageText.includes('Reset Your Password'));
    console.log('Account Security Portal badge visible:', resetPageText.includes('ACCOUNT SECURITY PORTAL'));
    console.log('Email pre-filled:', resetPageText.includes('monisha@gmail.com'));

    await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/reset_password_page_verified.png' });
  }

  await browser.close();
})();
