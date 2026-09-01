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

  console.log('1. Opening Admin Dashboard...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  console.log('2. Clicking "Courses" sidebar button...');
  const sidebarCourses = page.locator('aside button:has-text("Courses")').first();
  await sidebarCourses.click();
  await page.waitForTimeout(1000);

  console.log('3. Clicking "Create Course Batch" button...');
  const createBtn = page.locator('button:has-text("Create Course Batch")').first();
  await createBtn.click();
  await page.waitForTimeout(1000);

  console.log('4. Filling course creation form (Title: "abcd", Price: 1000)...');
  await page.locator('input[placeholder*="Class 10"]').first().fill('abcd');
  await page.locator('textarea').first().fill('Complete NCERT & RS Aggarwal Mathematics Coaching.');
  
  const priceInput = page.locator('input[type="number"]').first();
  await priceInput.fill('1000');

  console.log('5. Submitting Create Course form...');
  const submitCreate = page.locator('button:has-text("Publish & Save Batch")').first();
  await submitCreate.click();
  await page.waitForTimeout(1500);

  let text = await page.evaluate(() => document.body.innerText);
  console.log('Has Created Card "abcd":', text.includes('abcd'));

  console.log('6. Clicking "Manage" on created course "abcd"...');
  const cardManageBtn = page.locator('.group:has-text("abcd") button:has-text("Manage")').first();
  await cardManageBtn.click();
  await page.waitForTimeout(1000);

  console.log('7. Editing price to 1250 in Manage modal and saving...');
  const managePriceInput = page.locator('form input[type="number"]').first();
  await managePriceInput.fill('1250');

  const saveChangesBtn = page.locator('button:has-text("Save Changes")').first();
  await saveChangesBtn.click();
  await page.waitForTimeout(1000);

  text = await page.evaluate(() => document.body.innerText);
  const isPriceUpdated = text.includes('1250');
  console.log('Price Updated in UI to 1250:', isPriceUpdated);

  console.log('8. Clicking "Preview" on updated course "abcd"...');
  const cardPreviewBtn = page.locator('.group:has-text("abcd") button:has-text("Preview")').first();
  await cardPreviewBtn.click();
  await page.waitForTimeout(1000);

  text = await page.evaluate(() => document.body.innerText);
  const isPreviewOpen = text.includes('Student Portal Course Preview') && text.includes('abcd');
  console.log('Preview Modal Opened with "abcd":', isPreviewOpen);

  console.log(`\n=======================================================`);
  console.log(`🎉 FULL E2E COURSE CREATION, MANAGE & PREVIEW: ${text.includes('abcd') && isPriceUpdated && isPreviewOpen ? 'SUCCESS - 100% WORKING!' : 'FAILED'}`);
  console.log(`=======================================================\n`);

  const screenshotPath = path.join(process.cwd(), 'e2e_test_reports', 'full_e2e_user_course_manage_preview.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();
})();
