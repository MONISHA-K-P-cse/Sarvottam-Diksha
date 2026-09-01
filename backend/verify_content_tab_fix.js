import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.addInitScript(() => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_jwt');
  });

  console.log('1. Navigating to Course Detail Page...');
  await page.goto('https://sarvottam-diksha.web.app/courses/course_demo_1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  console.log('2. Clicking CONTENT Tab...');
  const contentTabBtn = page.locator('button:has-text("CONTENT")').first();
  await contentTabBtn.click();
  await page.waitForTimeout(1500);

  const text = await page.evaluate(() => document.body.innerText);
  console.log('--- CONTENT TAB PAGE TEXT ---');
  console.log(text.slice(0, 600));

  const hasCurriculumHeader = text.includes('Course Curriculum');
  const hasWatchLecture = text.includes('WATCH LECTURE');
  const hasViewPDF = text.includes('VIEW PDF');

  console.log(`\n=======================================================`);
  console.log(`📚 COURSE CONTENT TAB VERIFICATION: ${hasCurriculumHeader && hasWatchLecture && hasViewPDF ? 'SUCCESS - WORKING 100%!' : 'FAILED'}`);
  console.log(`=======================================================\n`);

  const screenshotPath = path.join(process.cwd(), 'e2e_test_reports', 'course_content_tab_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();
})();
