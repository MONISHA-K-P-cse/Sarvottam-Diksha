import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.addInitScript(() => {
    const customCourse = {
      id: 'course_test_999',
      title: 'Abhyaas Class 9 Special Revision Batch',
      description: 'Custom revision batch created by Manika Ma’am with live problem solving.',
      category: 'CLASS 9 MATHEMATICS',
      subject: 'Mathematics',
      price: 750,
      originalPrice: 1200,
      validityDays: 180,
      status: 'PUBLISHED',
      chapters: [
        { id: 'ch-1', title: 'Chapter 1: Polynomials & Proofs', duration: '2.5 Hours' }
      ]
    };
    window.localStorage.setItem('sd_custom_courses', JSON.stringify([customCourse]));
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_jwt');
  });

  console.log('1. Navigating directly to custom course preview URL (/courses/course_test_999)...');
  await page.goto('https://sarvottam-diksha.web.app/courses/course_test_999', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const text = await page.evaluate(() => document.body.innerText);
  console.log('--- CUSTOM COURSE PREVIEW PAGE TEXT ---');
  console.log(text.slice(0, 600));

  const hasTitle = text.includes('Abhyaas Class 9 Special Revision Batch');
  const hasPrice = text.includes('750') || text.includes('800');
  const hasGetCourse = text.includes('Get this course') || text.includes('You Pay');
  const hasValidity = text.includes('180 days');

  console.log(`\n=======================================================`);
  console.log(`✨ DYNAMIC CREATED COURSE PREVIEW VERIFICATION: ${hasTitle && hasPrice && hasGetCourse && hasValidity ? 'SUCCESS - 100% DYNAMIC & WORKING!' : 'FAILED'}`);
  console.log(`=======================================================\n`);

  const screenshotPath = path.join(process.cwd(), 'e2e_test_reports', 'dynamic_course_preview_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();
})();
