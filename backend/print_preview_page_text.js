import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://sarvottam-diksha.web.app/admin/courses/c1/preview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_token');

    const demoCourse = {
      id: 'c1',
      title: 'Class 10 Mathematics Complete NCERT Coaching',
      price: 650,
      category: 'CLASS 10 MATHEMATICS',
      status: 'PUBLISHED',
      description: 'Complete NCERT concept videos and tests',
      chapters: []
    };
    localStorage.setItem('sd_courses', JSON.stringify([demoCourse]));

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

  await page.goto('https://sarvottam-diksha.web.app/admin/courses/c1/preview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const fullText = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== VERIFICATION: COUPON ELIGIBILITY ===================');
  console.log('Contains CLASS10MATHS:', fullText.includes('CLASS10MATHS'));
  console.log('Contains "Eligible on this course":', fullText.includes('Eligible on this course'));
  console.log('========================================================================\n');

  console.log('Sample Page Text:\n', fullText.substring(0, 1500));

  await browser.close();
})();
