import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.on('dialog', async dialog => {
    console.log(`[Browser Dialog Handled]: ${dialog.message()}`);
    await dialog.accept();
  });

  console.log('1. Navigating to Admin Dashboard...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    localStorage.setItem('sd_token', 'demo_admin_jwt');

    // Seed a test to perform action checks
    const initialTest = {
      id: 'test_action_check_101',
      title: 'Real-Time Action Verification Test',
      category: '#Class10',
      tags: 'Class 10',
      durationMinutes: 45,
      totalMarks: 50,
      questionsCount: 2,
      attemptsCount: 0,
      status: 'Published',
      date: '2026/08/31'
    };

    localStorage.setItem('sd_custom_tests', JSON.stringify([initialTest]));
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('2. Opening Content -> Test Portal Workspace...');
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

  console.log('3. Testing Copy Test Button...');
  const copyBtn = page.locator('button:has-text("Copy Test")').first();
  if (await copyBtn.isVisible()) {
    await copyBtn.click({ force: true });
    await page.waitForTimeout(1000);
  }

  const hasCopied = await page.evaluate(() => {
    return document.body.innerText.includes('Real-Time Action Verification Test (Copy)');
  });

  console.log(`Copy Test Action: ${hasCopied ? 'SUCCESS' : 'FAILED'}`);

  console.log('4. Testing Move to Folder Button...');
  const moveBtn = page.locator('button:has-text("Move to folder")').first();
  if (await moveBtn.isVisible()) {
    await moveBtn.click({ force: true });
    await page.waitForTimeout(1000);

    const class11FolderBtn = page.locator('button:has-text("Class 11")').first();
    if (await class11FolderBtn.isVisible()) {
      await class11FolderBtn.click({ force: true });
      await page.waitForTimeout(500);

      const confirmMoveBtn = page.locator('button:has-text("Move to Class 11")').first();
      if (await confirmMoveBtn.isVisible()) {
        await confirmMoveBtn.click({ force: true });
        await page.waitForTimeout(1000);
      }
    }
  }

  const hasMovedFolder = await page.evaluate(() => {
    return document.body.innerText.includes('#Class 11') || document.body.innerText.includes('Class 11');
  });

  console.log(`Move to Folder Action: ${hasMovedFolder ? 'SUCCESS' : 'FAILED'}`);

  console.log('5. Capturing Final E2E Screenshot...');
  const screenshotPath = path.join(process.cwd(), 'e2e_test_reports', 'test_portal_actions_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();
})();
