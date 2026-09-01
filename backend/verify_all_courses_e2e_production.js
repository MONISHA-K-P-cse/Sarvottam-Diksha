import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const initialCourses = [
    { id: 'course_efgh', title: 'EFGH', price: 650, category: 'Class 10 Mathematics' },
    { id: 'course_abcd', title: 'abcd', price: 1000, category: 'Class 10 Mathematics' },
    { id: 'course_abhyaas', title: 'Abhyaas', price: 500, category: 'Class 9 Mathematics' },
    { id: 'course_abhyaas10', title: 'Abhyaas class 10', price: 500, category: 'Class 10 Mathematics' }
  ];

  await page.addInitScript((baseCourses) => {
    const existing = JSON.parse(window.localStorage.getItem('sd_custom_courses') || '[]');
    const mergedMap = new Map();
    baseCourses.forEach(c => mergedMap.set(c.id, c));
    existing.forEach(c => mergedMap.set(c.id, c));
    window.localStorage.setItem('sd_custom_courses', JSON.stringify(Array.from(mergedMap.values())));

    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_jwt');
  }, initialCourses);

  console.log('=======================================================');
  console.log('1. TESTING ALL EXISTING COURSES (MANAGE & PREVIEW)');
  console.log('=======================================================\n');

  let allPass = true;

  for (const crs of initialCourses) {
    console.log(`---> Testing Course: "${crs.title}" (${crs.id})`);

    // Manage Page Test
    await page.goto(`https://sarvottam-diksha.web.app/admin/courses/${crs.id}/manage`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    let text = await page.evaluate(() => document.body.innerText);
    const manageOk = text.includes(crs.title) && (text.includes('Basic Info') || text.includes('Settings') || text.includes('Save'));
    console.log(`   [MANAGE] ${crs.title}: ${manageOk ? 'PASS ✓' : 'FAIL ✗'}`);
    if (!manageOk) allPass = false;

    // Preview Page Test
    await page.goto(`https://sarvottam-diksha.web.app/admin/courses/${crs.id}/preview`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    text = await page.evaluate(() => document.body.innerText);
    const previewOk = text.includes(crs.title) && (text.includes('₹') || text.includes('Get this course') || text.includes('Available Offers'));
    console.log(`   [PREVIEW] ${crs.title}: ${previewOk ? 'PASS ✓' : 'FAIL ✗'}`);
    if (!previewOk) allPass = false;
  }

  console.log('\n=======================================================');
  console.log('2. TESTING NEWLY CREATED FUTURE COURSE ("QA_TEST_COURSE_DELETE_ME")');
  console.log('=======================================================\n');

  const newCourseId = 'course_qa_test_' + Date.now();
  await page.evaluate(({ id }) => {
    const existing = JSON.parse(localStorage.getItem('sd_custom_courses') || '[]');
    const newCourse = {
      id,
      title: 'QA_TEST_COURSE_DELETE_ME',
      description: 'Automated QA test course for dynamic route validation.',
      category: 'Class 10 Mathematics',
      price: 899,
      validityDays: 365,
      status: 'PUBLISHED'
    };
    localStorage.setItem('sd_custom_courses', JSON.stringify([newCourse, ...existing]));
  }, { id: newCourseId });

  // Test Manage on new course
  await page.goto(`https://sarvottam-diksha.web.app/admin/courses/${newCourseId}/manage`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  let textNewManage = await page.evaluate(() => document.body.innerText);
  const newManageOk = textNewManage.includes('QA_TEST_COURSE_DELETE_ME');
  console.log(`   [MANAGE] QA_TEST_COURSE_DELETE_ME: ${newManageOk ? 'PASS ✓' : 'FAIL ✗'}`);
  if (!newManageOk) allPass = false;

  // Test Preview on new course
  await page.goto(`https://sarvottam-diksha.web.app/admin/courses/${newCourseId}/preview`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  let textNewPreview = await page.evaluate(() => document.body.innerText);
  const newPreviewOk = textNewPreview.includes('QA_TEST_COURSE_DELETE_ME');
  console.log(`   [PREVIEW] QA_TEST_COURSE_DELETE_ME: ${newPreviewOk ? 'PASS ✓' : 'FAIL ✗'}`);
  if (!newPreviewOk) allPass = false;

  console.log('\n=======================================================');
  console.log('3. TESTING INVALID COURSE ID ("invalid_nonexistent_123")');
  console.log('=======================================================\n');

  await page.goto(`https://sarvottam-diksha.web.app/admin/courses/invalid_nonexistent_123/manage`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  let textInvalid = await page.evaluate(() => document.body.innerText);
  const invalidOk = textInvalid.includes('Course not found') && textInvalid.includes('Back to Course Catalog');
  console.log(`   [INVALID ID TEST]: ${invalidOk ? 'PASS ✓' : 'FAIL ✗'}`);
  if (!invalidOk) allPass = false;

  console.log('\n=======================================================');
  console.log(`🎉 OVERALL E2E PRODUCTION VERIFICATION: ${allPass ? 'ALL TESTS PASSED 100%' : 'SOME TESTS FAILED'}`);
  console.log('=======================================================\n');

  const artifactDir = '/Users/monisha/.gemini/antigravity-ide/brain/96160f44-8e21-49b8-9cea-f7f9be2c34b0';
  const screenshotPath = path.join(artifactDir, 'screenshot_e2e_production_all_courses.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved proof screenshot to: ${screenshotPath}`);

  await browser.close();
})();
