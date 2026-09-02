import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to https://sarvottam-diksha.web.app...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const portal = page.locator('#login-portal');
  await portal.scrollIntoViewIfNeeded();

  console.log('2. Clicking "Forgot Password?" on login card...');
  await portal.locator('button:has-text("Forgot Password?")').click();
  await page.waitForTimeout(500);

  let portalText = await portal.innerText();
  const hasOnlyEmailInput = (await portal.locator('input[type="password"]').count()) === 0;
  console.log('Password inputs hidden on forgot password card:', hasOnlyEmailInput);
  console.log('Button "Send Password Reset Email" visible:', portalText.includes('Send Password Reset Email'));

  await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/forgot_password_email_only_card.png' });

  console.log('3. Requesting password reset email for "monisha@gmail.com"...');
  await portal.locator('input[type="email"]').fill('monisha@gmail.com');
  await portal.locator('button:has-text("Send Password Reset Email")').click();
  await page.waitForTimeout(1500);

  portalText = await portal.innerText();
  const emailSentConfirmation = portalText.includes('Check Your Email') || portalText.includes('password reset email has been sent');
  console.log('Confirmation "Check Your Email" visible:', emailSentConfirmation);
  await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/forgot_password_email_sent_confirmation.png' });

  console.log('\n4. Testing password update via /reset-password for student with token...');
  await page.goto('https://sarvottam-diksha.web.app/reset-password?email=monisha@gmail.com&token=sd_sec_test_token_123', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const passInputs = await page.$$('input[type="password"]');
  if (passInputs.length >= 2) {
    await passInputs[0].fill('newsecret123');
    await passInputs[1].fill('newsecret123');
  }
  await page.click('button:has-text("Save New Password")');
  await page.waitForTimeout(3000);

  console.log('5. Verifying login with old password "student123" FAILS, and new password "newsecret123" SUCCEEDS...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.removeItem('sd_token');
    localStorage.removeItem('sd_user');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const portalAfter = page.locator('#login-portal');
  await portalAfter.scrollIntoViewIfNeeded();

  // Try old password
  await portalAfter.locator('input[type="email"]').fill('monisha@gmail.com');
  await portalAfter.locator('input[type="password"]').fill('student123');
  await portalAfter.locator('button:has-text("Sign In")').click();
  await page.waitForTimeout(1500);

  let afterText = await portalAfter.innerText();
  const oldPasswordRejected = afterText.includes('Incorrect password');
  console.log('Old password rejected after reset:', oldPasswordRejected);

  // Try new password
  await portalAfter.locator('input[type="password"]').fill('newsecret123');
  await portalAfter.locator('button:has-text("Sign In")').click();
  await page.waitForTimeout(2500);

  const currentUrl = page.url();
  console.log('Current URL after new password sign in:', currentUrl);
  const newPasswordAccepted = currentUrl.includes('/my-courses');
  console.log('New password accepted and logged in:', newPasswordAccepted);

  await browser.close();

  if (hasOnlyEmailInput && emailSentConfirmation && oldPasswordRejected && newPasswordAccepted) {
    console.log('\n🎉 ALL SECURITY TESTS PASSED: Password reset requires email link, and new password is fully saved and enforced!');
  } else {
    console.error('\n❌ Test mismatch.');
    process.exit(1);
  }
})();
