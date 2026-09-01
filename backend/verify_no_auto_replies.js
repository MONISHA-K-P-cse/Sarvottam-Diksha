import { chromium } from 'playwright';

(async () => {
  console.log('1. Launching Playwright to test manual live chat...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const studentUser = {
    id: 'student_monisha_777',
    name: 'Monisha K P',
    email: 'monisha@gmail.com',
    role: 'STUDENT'
  };

  await context.addInitScript(({ u, t }) => {
    window.localStorage.setItem('sd_user', JSON.stringify(u));
    window.localStorage.setItem('user', JSON.stringify(u));
    window.localStorage.setItem('sd_token', t);
  }, { u: studentUser, t: 'demo_student_token' });

  const page = await context.newPage();

  console.log('2. Opening Doubts Chat (/chats)...');
  await page.goto('https://sarvottam-diksha.web.app/chats', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Send a test message
  const input = page.locator('input[placeholder*="Ask a Mathematics doubt"]').first();
  if (await input.isVisible()) {
    await input.fill('Is class available today?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000); // Wait to verify NO auto-reply triggers
  }

  await page.screenshot({ path: '../no_auto_replies_verified.png' });

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n=================== VERIFICATION: NO AUTO-REPLIES ===================');
  console.log('Contains automatic reply string "I have received your doubt regarding":', bodyText.includes('I have received your doubt regarding'));
  console.log('======================================================================\n');

  await browser.close();
})();
