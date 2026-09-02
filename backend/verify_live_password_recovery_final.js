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

  console.log('2. Clicking "Forgot Password?" button on sign-in card...');
  const forgotBtn = await page.$('button:has-text("Forgot Password?")');
  if (forgotBtn) {
    await forgotBtn.click();
    await page.waitForTimeout(1000);
  }

  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('\n=================== PASSWORD RECOVERY CARD VERIFICATION ===================');
  console.log('Title "Reset Your Password" visible:', pageText.includes('Reset Your Password'));
  console.log('Badge "ACCOUNT SECURITY PORTAL" visible:', pageText.includes('ACCOUNT SECURITY PORTAL'));
  console.log('Save New Password button visible:', pageText.includes('Save New Password & Sign In'));
  console.log('Return to Sign In button visible:', pageText.includes('Return to Sign In'));
  console.log('============================================================================\n');

  await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/password_recovery_card_verified.png' });

  console.log('3. Filling email "dikshasarvottam@gmail.com" and new password "admin123"...');
  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    await emailInput.fill('dikshasarvottam@gmail.com');
  }

  const passInputs = await page.$$('input[type="password"]');
  if (passInputs.length >= 2) {
    await passInputs[0].fill('admin123');
    await passInputs[1].fill('admin123');
  }

  console.log('4. Clicking "Save New Password & Sign In"...');
  await page.click('button:has-text("Save New Password & Sign In")');
  await page.waitForTimeout(2500);

  const afterSubmitText = await page.evaluate(() => document.body.innerText);
  console.log('Success banner visible:', afterSubmitText.includes('Password reset successfully') || afterSubmitText.includes('Logging you into your portal'));
  
  await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/password_recovery_submitted_verified.png' });

  await browser.close();
})();
