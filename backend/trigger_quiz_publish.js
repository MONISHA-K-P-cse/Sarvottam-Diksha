import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.on('dialog', async dialog => {
    console.log(`[Browser Alert Dismissed]: ${dialog.message()}`);
    await dialog.accept();
  });

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

    // Seed a custom test directly in localStorage to verify instantaneous reflect
    const newQuiz = {
      id: 'test_' + Date.now(),
      title: 'Polynomials & Quadratic Equations Master Series 2026',
      category: '#Class10, #ABHYAAS',
      tags: 'Class 10',
      durationMinutes: 60,
      totalMarks: 100,
      negativeMarks: 0.25,
      accessMode: 'FREE',
      price: 0,
      questions: [
        {
          id: 'q1',
          questionText: 'Find the roots of x^2 - 7x + 12 = 0',
          optionA: '3, 4',
          optionB: '2, 5',
          optionC: '-3, -4',
          optionD: '1, 12',
          correctOption: 'A',
          explanation: '(x-3)(x-4) = 0 => x = 3, 4'
        }
      ],
      questionsCount: 1,
      attemptsCount: 0,
      status: 'Published',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '/')
    };

    const existing = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
    localStorage.setItem('sd_custom_tests', JSON.stringify([newQuiz, ...existing]));
  });

  console.log('2. Reloading page to load newly seeded test...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('3. Navigating to Content -> Test Portal...');
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

  console.log('4. Capturing Final Verification Screenshot...');
  const screenshotPath = path.join(process.cwd(), 'e2e_test_reports', 'live_test_portal_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  const hasNewQuiz = await page.evaluate(() => {
    return document.body.innerText.includes('Polynomials & Quadratic Equations Master Series 2026');
  });

  console.log(`\n=======================================================`);
  console.log(`🎉 TEST PORTAL REFLECTION VERIFICATION: ${hasNewQuiz ? 'SUCCESS - REFLECTED ON SCREEN!' : 'FAILED'}`);
  console.log(`=======================================================\n`);

  await browser.close();
})();
