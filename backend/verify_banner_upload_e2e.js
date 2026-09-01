import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_token');
  });

  console.log('1. Navigating to Admin Dashboard with Banner Modal flag (https://sarvottam-diksha.web.app/admin?bannerModal=true)...');
  await page.goto('https://sarvottam-diksha.web.app/admin?bannerModal=true', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('2. Filling Banner Form Details...');
  const titleInput = page.locator('input[placeholder*="Board Exam Target"]').first();
  await titleInput.fill('Class 10 CBSE Math Olympiad Special Banner');

  const descInput = page.locator('input[placeholder*="specialized Mathematics batch"]').first();
  await descInput.fill('Exclusive 100/100 target batch by Manika Maheshwari');

  console.log('3. Clicking "Publish New Banner Live"...');
  const submitBtn = page.locator('button:has-text("Publish New Banner Live")').first();
  await submitBtn.click();
  await page.waitForTimeout(2000);

  const bodyText = await page.evaluate(() => document.body.innerText);
  const bannerCreatedOk = bodyText.includes('Class 10 CBSE Math Olympiad Special Banner');

  console.log('\n=================== BANNER UPLOAD E2E VERIFICATION REPORT ===================');
  console.log('Banner Created & Published Live:', bannerCreatedOk ? 'PASS ✓' : 'FAIL ✗');
  console.log('=============================================================================\n');

  const artifactDir = '/Users/monisha/.gemini/antigravity-ide/brain/96160f44-8e21-49b8-9cea-f7f9be2c34b0';
  const screenshotPath = path.join(artifactDir, 'screenshot_banner_upload_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();
})();
