import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log('1. Opening Admin Dashboard...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    localStorage.setItem('sd_token', 'demo_admin_jwt');

    const tests = [
      {
        id: 'test_c6_101',
        title: 'Class 6 Integers & Algebra Mastery Test',
        category: '#Class 6',
        tags: 'Class 6',
        folder: 'Class 6',
        questionsCount: 5,
        status: 'Published'
      },
      {
        id: 'test_c7_102',
        title: 'Class 7 Fractions & Decimals Board Test',
        category: '#Class 7',
        tags: 'Class 7',
        folder: 'Class 7',
        questionsCount: 5,
        status: 'Published'
      }
    ];

    localStorage.setItem('sd_custom_tests', JSON.stringify(tests));
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Navigate to Test Portal
  const contentTabBtn = page.locator('button:has-text("Content")').first();
  if (await contentTabBtn.isVisible()) {
    await contentTabBtn.click({ force: true });
    await page.waitForTimeout(1000);
  }

  const testPortalSubTab = page.locator('button:has-text("Test Portal")').first();
  if (await testPortalSubTab.isVisible()) {
    await testPortalSubTab.click({ force: true });
    await page.waitForTimeout(1000);
  }

  console.log('2. Clicking Class 6 Folder Card...');
  const c6Folder = page.locator('div').filter({ hasText: /^Class 6$/ }).first();
  if (await c6Folder.isVisible()) {
    await c6Folder.click({ force: true });
    await page.waitForTimeout(1500);
  }

  const result = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasClass6Test = text.includes('Class 6 Integers & Algebra Mastery Test');
    const excludesClass7Test = !text.includes('Class 7 Fractions & Decimals Board Test');
    return hasClass6Test && excludesClass7Test;
  });

  console.log(`\n=======================================================`);
  console.log(`🎉 CLASS 6 FOLDER STRICTNESS VERIFICATION: ${result ? 'SUCCESS - ONLY CLASS 6 TESTS VISIBLE!' : 'FAILED'}`);
  console.log(`=======================================================\n`);

  const screenshotPath = path.join(process.cwd(), 'e2e_test_reports', 'class_6_folder_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();
})();
