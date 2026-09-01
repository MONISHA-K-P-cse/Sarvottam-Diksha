import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. First visit to initialize domain context...');
  await page.goto('https://sarvottam-diksha.web.app/admin/courses/c1/preview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('2. Injecting admin user session & specific coupon CLASS10MATHS...');
  await page.evaluate(() => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_token');

    const demoCoupon = {
      id: 'coupon_demo_c1',
      code: 'CLASS10MATHS',
      title: 'Class 10 Special Math Discount',
      discountType: 'FLAT',
      discountValue: 150,
      courseSelectionType: 'SPECIFIC',
      assignedCourseIds: ['c1'],
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('sd_coupons', JSON.stringify([demoCoupon]));
  });

  console.log('3. Re-navigating to /admin/courses/c1/preview...');
  await page.goto('https://sarvottam-diksha.web.app/admin/courses/c1/preview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const pageText = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== VERIFICATION: COUPON ELIGIBILITY ===================');
  console.log('Contains CLASS10MATHS:', pageText.includes('CLASS10MATHS'));
  console.log('Contains "Eligible on this course":', pageText.includes('Eligible on this course'));
  console.log('========================================================================\n');

  await browser.close();
})();
