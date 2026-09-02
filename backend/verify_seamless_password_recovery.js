import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to https://sarvottam-diksha.web.app...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });

  // Clear localStorage
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('2. Entering email "dikshasarvottam@gmail.com" and clicking Forgot Password?...');
  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    await emailInput.fill('dikshasarvottam@gmail.com');
  }

  const forgotBtn = await page.$('button:has-text("Forgot Password?")');
  if (forgotBtn) {
    console.log('Clicking "Forgot Password?" button...');
    await forgotBtn.click();
  }

  console.log('3. Waiting for Reset Your Password screen to appear...');
  await page.waitForSelector('text=Reset Your Password', { timeout: 10000 });
  await page.waitForTimeout(1000);

  const resetPageText = await page.evaluate(() => document.body.innerText);
  console.log('\n=================== SEAMLESS PASSWORD RECOVERY VERIFICATION ===================');
  console.log('Reset Password page loaded:', resetPageText.includes('Reset Your Password'));
  console.log('Account Security Portal badge visible:', resetPageText.includes('ACCOUNT SECURITY PORTAL'));
  console.log('Email pre-filled:', resetPageText.includes('dikshasarvottam@gmail.com'));
  console.log('=================================================================================\n');

  await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/seamless_password_recovery_verified.png' });

  console.log('4. Entering new password "admin123" and confirming reset...');
  const passInputs = await page.$$('input[type="password"]');
  if (passInputs.length >= 2) {
    await passInputs[0].fill('admin123');
    await passInputs[1].fill('admin123');
    await page.click('button:has-text("Save New Password & Log In")');
    await page.waitForTimeout(2500);

    const afterResetText = await page.evaluate(() => document.body.innerText);
    console.log('Password Reset Success Message:', afterResetText.includes('Password Reset Successfully!'));
    await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/password_reset_success_verified.png' });
  }

  await browser.close();
})();
