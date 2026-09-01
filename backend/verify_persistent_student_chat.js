import { chromium } from 'playwright';

(async () => {
  console.log('1. Launching Playwright to test student chat persistence across logout & login...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const monishaUser = {
    id: 'student_monisha_888',
    name: 'Monisha K P',
    email: 'monisha@gmail.com',
    role: 'STUDENT'
  };

  await context.addInitScript(({ u, t }) => {
    window.localStorage.setItem('sd_user', JSON.stringify(u));
    window.localStorage.setItem('user', JSON.stringify(u));
    window.localStorage.setItem('sd_token', t);
  }, { u: monishaUser, t: 'monisha_student_token' });

  const page = await context.newPage();

  console.log('2. Monisha navigating to Doubts Chat (/chats)...');
  await page.goto('https://sarvottam-diksha.web.app/chats', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Send a message as Monisha
  const testMsgText = `Hi Ma'am persistent test message ${Date.now()}`;
  console.log(`3. Monisha sending message: "${testMsgText}"...`);
  await page.fill('input[placeholder*="Type your doubt"], input[placeholder*="Ask"]', testMsgText);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  console.log('4. Monisha logging out (clearing auth state)...');
  await page.evaluate(() => {
    localStorage.removeItem('sd_token');
    localStorage.removeItem('sd_user');
  });

  console.log('5. Monisha logging back in...');
  await page.evaluate((u) => {
    localStorage.setItem('sd_user', JSON.stringify(u));
    localStorage.setItem('sd_token', 'monisha_student_token');
  }, monishaUser);

  await page.goto('https://sarvottam-diksha.web.app/chats', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  await page.screenshot({ path: '../chat_persistence_verified.png' });

  const bodyText = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== VERIFICATION: STUDENT CHAT PERSISTENCE ===================');
  console.log('Message retrieved after re-login:', bodyText.includes(testMsgText));
  console.log('===============================================================================\n');

  await browser.close();
})();
