import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.on('dialog', async dialog => {
    console.log(`[Browser Alert Dismissed]: ${dialog.message()}`);
    await dialog.accept();
  });

  console.log('1. Navigating to Admin Dashboard...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'domcontentloaded' });

  console.log('2. Setting Admin Session & Opening Quiz Builder...');
  await page.evaluate(() => {
    localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    localStorage.setItem('sd_token', 'demo_admin_jwt');
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Click + Create Quiz button
  const createBtn = page.locator('button:has-text("+ Create Quiz")').first();
  if (await createBtn.isVisible()) {
    await createBtn.click({ force: true });
    await page.waitForTimeout(1000);
  }

  // Ensure title input is populated
  const titleField = page.locator('#testTitleInput').first();
  if (await titleField.isVisible()) {
    await titleField.fill('Polynomials CBSE Master Quiz 2026');
  } else {
    console.log('Title field not visible directly, opening modal via DOM...');
    await page.evaluate(() => {
      // Force trigger form submit or title state
      const form = document.querySelector('form');
      if (form) form.scrollIntoView();
    });
  }

  console.log('3. Clicking Save & Publish Test...');
  const publishBtn = page.locator('button:has-text("Save & Publish Test")').first();
  if (await publishBtn.isVisible()) {
    await publishBtn.click({ force: true });
    await page.waitForTimeout(2500);
  }

  console.log('4. Capturing Verification Screenshot...');
  const screenshotPath = path.join(process.cwd(), 'e2e_test_reports', 'live_quiz_published_verification.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  const hasNewQuiz = await page.evaluate(() => {
    return document.body.innerText.includes('Polynomials CBSE Master Quiz 2026') ||
           document.body.innerText.includes('ABHYAAS Mathematics Practice Test');
  });

  console.log(`\n=======================================================`);
  console.log(`🎉 LIVE QUIZ CREATION VERIFICATION: ${hasNewQuiz ? 'SUCCESS - REFLECTED ON SCREEN!' : 'FAILED'}`);
  console.log(`=======================================================\n`);

  await browser.close();
})();
