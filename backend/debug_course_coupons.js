import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://sarvottam-diksha.web.app/store/c1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
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

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const debugInfo = await page.evaluate(() => {
    return {
      storedCoupons: localStorage.getItem('sd_coupons'),
      bodyText: document.body.innerText.substring(0, 1500)
    };
  });

  console.log('Stored Coupons in localStorage:', debugInfo.storedCoupons);
  console.log('\nBody Text Sample:\n', debugInfo.bodyText);

  await browser.close();
})();
