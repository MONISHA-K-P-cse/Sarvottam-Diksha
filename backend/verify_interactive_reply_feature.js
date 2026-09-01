import { chromium } from 'playwright';

(async () => {
  console.log('1. Verifying click to reply in Doubt Chats...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const adminUser = {
    id: '88261e1a-5267-4059-bb73-3e9a26585e7f',
    name: 'Manika Maheshwari',
    email: 'Dikshasarvottam@gmail.com',
    role: 'ADMIN'
  };

  await context.addInitScript(({ u, t }) => {
    window.localStorage.setItem('sd_user', JSON.stringify(u));
    window.localStorage.setItem('user', JSON.stringify(u));
    window.localStorage.setItem('sd_token', t);
  }, { u: adminUser, t: 'demo_admin_token' });

  const page = await context.newPage();

  console.log('2. Navigating to Admin Portal (/admin)...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('3. Opening Doubt Chats tab...');
  await page.click('button:has-text("Doubt Chats")');
  await page.waitForTimeout(2000);

  console.log('4. Clicking welcome message bubble to initiate reply...');
  const msgBubble = page.locator('div[title="Click message to reply"]').first();
  await msgBubble.click();
  await page.waitForTimeout(1000);

  const textAfterClick = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== VERIFICATION RESULT ===================');
  console.log('Replying banner visible:', textAfterClick.includes('Replying to'));
  console.log('Send Reply button visible:', textAfterClick.includes('Send Reply'));
  console.log('===========================================================\n');

  await page.screenshot({ path: '../interactive_reply_success_verified.png' });

  await browser.close();
})();
