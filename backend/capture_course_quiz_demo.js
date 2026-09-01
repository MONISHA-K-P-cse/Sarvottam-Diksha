import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const artifactDir = '/Users/monisha/.gemini/antigravity-ide/brain/ecfe658c-6772-4ba9-8b78-ac1de48d58fa';

async function captureDemoScreenshots() {
  console.log('🚀 Launching Chromium Headless for Course Quiz Feature Demonstration...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 1. Capture Test Portal - Categorized Quizzes
    console.log('📸 1. Capturing Test Portal (/free-test)...');
    await page.goto('http://localhost:5173/free-test', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const screenshot1Path = path.join(artifactDir, `test_portal_categories_${Date.now()}.png`);
    await page.screenshot({ path: screenshot1Path, fullPage: false });
    console.log(`🟢 Saved: ${screenshot1Path}`);

    // 2. Click on Locked / Paid Standalone Tab & Trigger Razorpay Modal
    console.log('📸 2. Clicking Locked Standalone Tab & Triggering Razorpay Modal...');
    const lockedTab = page.locator('button:has-text("LOCKED / PAID STANDALONE")');
    if (await lockedTab.isVisible()) {
      await lockedTab.click();
      await page.waitForTimeout(500);
      
      const unlockBtn = page.locator('button:has-text("UNLOCK STANDALONE TEST")').first();
      if (await unlockBtn.isVisible()) {
        await unlockBtn.click();
        await page.waitForTimeout(1000);
        const screenshot2Path = path.join(artifactDir, `quiz_razorpay_modal_${Date.now()}.png`);
        await page.screenshot({ path: screenshot2Path, fullPage: false });
        console.log(`🟢 Saved: ${screenshot2Path}`);
      }
    }

    // 3. Admin Test Publisher Workspace
    console.log('📸 3. Capturing Admin Dashboard Quiz Publisher...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const screenshot3Path = path.join(artifactDir, `admin_dashboard_home_${Date.now()}.png`);
    await page.screenshot({ path: screenshot3Path, fullPage: false });
    console.log(`🟢 Saved: ${screenshot3Path}`);

    await browser.close();
    console.log('🎉 Screenshots successfully generated!');
  } catch (err) {
    console.error('Capture Error:', err);
    await browser.close();
  }
}

captureDemoScreenshots();
