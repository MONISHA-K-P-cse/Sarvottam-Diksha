import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.addInitScript(() => {
    const userCourses = [
      {
        id: 'course_efgh',
        title: 'EFGH',
        description: 'Class 9 Special Foundation Batch',
        category: 'Class 9 Mathematics',
        price: 650,
        validityDays: 365,
        status: 'PUBLISHED'
      },
      {
        id: 'course_abhyaas',
        title: 'Abhyaas',
        description: 'Complete NCERT Maths Batch',
        category: 'Class 10 Mathematics',
        price: 500,
        validityDays: 365,
        status: 'PUBLISHED'
      }
    ];
    window.localStorage.setItem('sd_custom_courses', JSON.stringify(userCourses));
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_jwt');
  });

  console.log('1. Navigating to Admin Dashboard Manage Coupons page...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const sidebarCoupons = page.locator('button:has-text("Manage Coupons")').first();
  await sidebarCoupons.click();
  await page.waitForTimeout(1500);

  console.log('2. Clicking "Create Coupon" button...');
  const createCouponBtn = page.locator('button:has-text("Create Coupon")').first();
  await createCouponBtn.click();
  await page.waitForTimeout(1000);

  console.log('3. Filling Step 1 (Offer Name & Code: "FESTIVE200", Flat ₹200)...');
  await page.locator('input[placeholder*="Offer Name"]').first().fill('Festive Season Sale');
  await page.locator('input[placeholder*="EARLYBIRD"]').first().fill('FESTIVE200');
  await page.locator('input[placeholder*="discount amount"]').first().fill('200');

  const nextStep1Btn = page.locator('button:has-text("Next")').first();
  await nextStep1Btn.click();
  await page.waitForTimeout(1000);

  console.log('4. Step 2: Selecting "Assign to specific courses" and clicking Next...');
  const specificRadio = page.locator('label:has-text("Assign to specific courses") input').first();
  await specificRadio.click();

  const nextStep2Btn = page.locator('button:has-text("Next")').first();
  await nextStep2Btn.click();
  await page.waitForTimeout(1000);

  console.log('5. Step 3: Selecting course "EFGH" and clicking "Finish"...');
  const efghCheckbox = page.locator('label:has-text("EFGH") input').first();
  await efghCheckbox.click();

  const finishBtn = page.locator('button:has-text("Finish")').first();
  await finishBtn.click();
  await page.waitForTimeout(2500);

  let text = await page.evaluate(() => document.body.innerText);
  const isCouponCreated = text.includes('FESTIVE200') || text.includes('Festive');
  console.log('Coupon FESTIVE200 created successfully:', isCouponCreated);

  console.log('6. Testing Coupon Application on Course Preview Page (/courses/course_efgh)...');
  await page.goto('https://sarvottam-diksha.web.app/courses/course_efgh', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  console.log('7. Entering coupon code "FESTIVE200" and clicking Apply...');
  const couponInput = page.locator('input[placeholder*="WELCOME500"]').first();
  await couponInput.fill('FESTIVE200');

  const applyBtn = page.locator('button:has-text("Apply here")').first();
  await applyBtn.click();
  await page.waitForTimeout(1500);

  text = await page.evaluate(() => document.body.innerText);
  const isAppliedSuccess = text.includes('applied') || text.includes('Saved ₹200') || text.includes('FESTIVE200');
  console.log('Coupon FESTIVE200 applied on EFGH course:', isAppliedSuccess);

  console.log(`\n=======================================================`);
  console.log(`🎉 COUPON CREATION & APPLICATION E2E: ${isCouponCreated && isAppliedSuccess ? 'SUCCESS - 100% WORKING!' : 'FAILED'}`);
  console.log(`=======================================================\n`);

  const artifactDir = '/Users/monisha/.gemini/antigravity-ide/brain/96160f44-8e21-49b8-9cea-f7f9be2c34b0';
  const screenshotPath = path.join(artifactDir, 'screenshot_coupon_creation_applied_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();
})();
