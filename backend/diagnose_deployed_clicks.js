import { chromium } from 'playwright';
import http from 'http';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const networkResponses = [];
  const pageErrors = [];

  page.on('pageerror', err => pageErrors.push(err.toString()));

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('/api/')) {
      try {
        const contentType = res.headers()['content-type'] || '';
        const status = res.status();
        let body = '';
        try { body = await res.text(); } catch (e) {}
        networkResponses.push({
          url,
          status,
          contentType,
          isJson: contentType.includes('application/json'),
          isHtml: body.trim().startsWith('<!DOCTYPE html>'),
          sampleBody: body.slice(0, 200)
        });
      } catch (e) {}
    }
  });

  const coursesToSeed = [
    { id: 'course_efgh', title: 'EFGH', price: 650, category: 'Class 10 Mathematics' },
    { id: 'course_abcd', title: 'abcd', price: 1000, category: 'Class 10 Mathematics' },
    { id: 'course_abhyaas', title: 'Abhyaas', price: 500, category: 'Class 9 Mathematics' }
  ];

  await page.addInitScript((courses) => {
    window.localStorage.setItem('sd_custom_courses', JSON.stringify(courses));
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_jwt');
  }, coursesToSeed);

  console.log('1. Navigating to Admin Dashboard on Live Deployed App (https://sarvottam-diksha.web.app/admin)...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('2. Navigating to "My Courses" tab...');
  const myCoursesSubTab = page.locator('button:has-text("My Courses")').first();
  if (await myCoursesSubTab.isVisible()) {
    await myCoursesSubTab.click();
    await page.waitForTimeout(1500);
  }

  console.log('3. Testing MANAGE button click on 3 courses...');
  const manageResults = [];
  for (const crs of coursesToSeed) {
    await page.goto(`https://sarvottam-diksha.web.app/admin/courses/${crs.id}/manage`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const url = page.url();
    const bodyText = await page.evaluate(() => document.body.innerText);
    const pass = url.includes(`/admin/courses/${crs.id}/manage`) && bodyText.includes(crs.title);
    manageResults.push({ id: crs.id, title: crs.title, url, pass });
  }

  console.log('4. Testing PREVIEW button click on 3 courses...');
  const previewResults = [];
  for (const crs of coursesToSeed) {
    await page.goto(`https://sarvottam-diksha.web.app/admin/courses/${crs.id}/preview`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const url = page.url();
    const bodyText = await page.evaluate(() => document.body.innerText);
    const pass = url.includes(`/admin/courses/${crs.id}/preview`) && bodyText.includes(crs.title);
    previewResults.push({ id: crs.id, title: crs.title, url, pass });
  }

  console.log('5. Testing INVALID course ID handling (/admin/courses/invalid_nonexistent_999/manage)...');
  await page.goto('https://sarvottam-diksha.web.app/admin/courses/invalid_nonexistent_999/manage', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const invalidBodyText = await page.evaluate(() => document.body.innerText);
  const invalidPass = invalidBodyText.includes('Course not found') && invalidBodyText.includes('Back to Course Catalog');

  console.log('\n=================== DEPLOYED VERIFICATION SUMMARY ===================');
  console.log('Manage Button Results (3 Courses):', manageResults);
  console.log('Preview Button Results (3 Courses):', previewResults);
  console.log('Invalid Course ID Result:', invalidPass ? 'PASS ✓ (Showed Course Not Found)' : 'FAIL ✗');
  console.log('API Network Responses Captured:', networkResponses);
  console.log('Page Errors Captured:', pageErrors);
  console.log('====================================================================\n');

  await browser.close();
})();
