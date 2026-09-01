import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const artifactDir = '/Users/monisha/.gemini/antigravity-ide/brain/96160f44-8e21-49b8-9cea-f7f9be2c34b0';
  
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

  console.log('2. Navigating to Courses tab...');
  const sidebarCourses = page.locator('aside button:has-text("Courses")').first();
  await sidebarCourses.click();
  await page.waitForTimeout(1500);

  console.log('3. Opening Create Course Batch Wizard...');
  const createBtn = page.locator('button:has-text("Create Course Batch")').first();
  await createBtn.click();
  await page.waitForTimeout(1000);

  console.log('4. Entering Course Name ("abcd") and Description...');
  const nameInput = page.locator('input[placeholder="Enter course name"]').first();
  await nameInput.fill('abcd');

  const descTextarea = page.locator('textarea[placeholder="Enter course description here."]').first();
  await descTextarea.fill('Complete NCERT & RS Aggarwal Mathematics Coaching with step-by-step video solutions and chapterwise test series.');

  console.log('5. Advancing to Edit Price step...');
  const editPriceBtn = page.locator('button:has-text("Edit Price")').first();
  await editPriceBtn.click();
  await page.waitForTimeout(1000);

  console.log('6. Advancing to Add Content step...');
  const addContentBtn = page.locator('button:has-text("Add Content")').first();
  await addContentBtn.click();
  await page.waitForTimeout(1000);

  console.log('7. Publishing course...');
  const publishBtn = page.locator('button:has-text("Publish")').first();
  await publishBtn.click();
  await page.waitForTimeout(2000);

  // Screenshot 1: Admin Courses Grid View
  const screenshot1Path = path.join(artifactDir, 'screenshot_admin_courses_grid.png');
  await page.screenshot({ path: screenshot1Path, fullPage: true });
  console.log(`Saved screenshot 1: ${screenshot1Path}`);

  console.log('8. Clicking "Manage" on created course "abcd"...');
  const cardManageBtn = page.locator('.group:has-text("abcd") button:has-text("Manage")').first();
  await cardManageBtn.click();
  await page.waitForTimeout(1500);

  // Screenshot 2: Manage Course Modal
  const screenshot2Path = path.join(artifactDir, 'screenshot_manage_course_modal.png');
  await page.screenshot({ path: screenshot2Path, fullPage: true });
  console.log(`Saved screenshot 2: ${screenshot2Path}`);

  console.log('9. Closing Manage modal and clicking "Preview"...');
  const cancelBtn = page.locator('button:has-text("Cancel")').first();
  if (await cancelBtn.isVisible()) {
    await cancelBtn.click();
    await page.waitForTimeout(1000);
  }

  const cardPreviewBtn = page.locator('.group:has-text("abcd") button:has-text("Preview")').first();
  await cardPreviewBtn.click();
  await page.waitForTimeout(2500);

  // Screenshot 3: Student Course Preview Page
  const screenshot3Path = path.join(artifactDir, 'screenshot_student_course_preview.png');
  await page.screenshot({ path: screenshot3Path, fullPage: true });
  console.log(`Saved screenshot 3: ${screenshot3Path}`);

  await browser.close();
  console.log('ALL SCREENSHOTS TAKEN SUCCESSFULLY!');
})();
