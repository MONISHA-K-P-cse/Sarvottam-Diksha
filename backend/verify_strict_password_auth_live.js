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

  // Focus the portal container
  const portal = page.locator('#login-portal');
  await portal.scrollIntoViewIfNeeded();

  console.log('\n2. Testing WRONG password for Student "monisha@gmail.com" with password "wrongpassword999"...');
  await portal.locator('input[type="email"]').fill('monisha@gmail.com');
  await portal.locator('input[type="password"]').fill('wrongpassword999');
  await portal.locator('button:has-text("Sign In")').click();
  await page.waitForTimeout(1500);

  let pageText = await portal.innerText();
  const studentWrongPassRejected = pageText.includes('Incorrect password') || pageText.includes('Invalid');
  console.log('Student wrong password rejected properly:', studentWrongPassRejected, '| Card text snippet:', pageText.slice(0, 300));
  await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/student_wrong_pass_rejected.png' });

  console.log('\n3. Testing WRONG password for Admin "dikshasarvottam@gmail.com" with passcode "wrongadmin999"...');
  await portal.locator('button:has-text("I am Teacher (Admin)")').click();
  await page.waitForTimeout(500);
  await portal.locator('input[type="email"]').fill('dikshasarvottam@gmail.com');
  await portal.locator('input[type="password"]').fill('wrongadmin999');
  await portal.locator('button:has-text("Sign In")').click();
  await page.waitForTimeout(1500);

  pageText = await portal.innerText();
  const adminWrongPassRejected = pageText.includes('Incorrect admin passcode') || pageText.includes('Incorrect password');
  console.log('Admin wrong password rejected properly:', adminWrongPassRejected, '| Card text snippet:', pageText.slice(0, 300));
  await page.screenshot({ path: '/Users/monisha/Desktop/Sarvottam-Diksha/backend/admin_wrong_pass_rejected.png' });

  console.log('\n4. Testing CORRECT password for Admin "dikshasarvottam@gmail.com" with passcode "admin123"...');
  await portal.locator('input[type="password"]').fill('admin123');
  await portal.locator('button:has-text("Sign In")').click();
  await page.waitForTimeout(2500);

  const currentUrl = page.url();
  console.log('Current URL after correct login (should be /admin):', currentUrl);
  const adminLoginSuccess = currentUrl.includes('/admin');
  console.log('Admin correct login success:', adminLoginSuccess);

  await browser.close();

  if (studentWrongPassRejected && adminWrongPassRejected && adminLoginSuccess) {
    console.log('\n🎉 ALL TESTS PASSED: Strict password authentication is verified and working 100%!');
  } else {
    console.error('\n❌ Test failure detected.');
    process.exit(1);
  }
})();
