import { chromium } from 'playwright';

(async () => {
  console.log('1. Launching Playwright to test student -> admin message delivery...');
  const browser = await chromium.launch({ headless: true });
  const studentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const studentUser = {
    id: 'student_monisha_777',
    name: 'Monisha K P',
    email: 'monisha@gmail.com',
    role: 'STUDENT'
  };

  await studentContext.addInitScript(({ u, t }) => {
    window.localStorage.setItem('sd_user', JSON.stringify(u));
    window.localStorage.setItem('user', JSON.stringify(u));
    window.localStorage.setItem('sd_token', t);
  }, { u: studentUser, t: 'demo_student_token' });

  const studentPage = await studentContext.newPage();
  console.log('2. Sending message from Monisha student account...');
  await studentPage.goto('https://sarvottam-diksha.web.app/chats', { waitUntil: 'networkidle' });
  await studentPage.waitForTimeout(2000);

  const input = studentPage.locator('input[placeholder*="Ask a Mathematics doubt"]').first();
  if (await input.isVisible()) {
    await input.fill('Hello Manika Maam this is Monisha!');
    await studentPage.keyboard.press('Enter');
    await studentPage.waitForTimeout(2000);
  }

  // Extract localStorage state to share with admin tab
  const convsData = await studentPage.evaluate(() => localStorage.getItem('sd_conversations'));
  const msgsData = await studentPage.evaluate(() => localStorage.getItem('sd_messages_student_monisha_777'));

  console.log('3. Opening Admin Portal in second context...');
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminUser = {
    id: '88261e1a-5267-4059-bb73-3e9a26585e7f',
    name: 'Manika Maheshwari',
    email: 'Dikshasarvottam@gmail.com',
    role: 'ADMIN'
  };

  await adminContext.addInitScript(({ u, t, c, m }) => {
    window.localStorage.setItem('sd_user', JSON.stringify(u));
    window.localStorage.setItem('user', JSON.stringify(u));
    window.localStorage.setItem('sd_token', t);
    if (c) window.localStorage.setItem('sd_conversations', c);
    if (m) window.localStorage.setItem('sd_messages_student_monisha_777', m);
  }, { u: adminUser, t: 'demo_admin_token', c: convsData, m: msgsData });

  const adminPage = await adminContext.newPage();
  await adminPage.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await adminPage.waitForTimeout(2500);

  // Click "Doubt Chats" menu
  const doubtChatsBtn = adminPage.locator('text="Doubt Chats"').first();
  if (await doubtChatsBtn.isVisible()) {
    await doubtChatsBtn.click();
    await adminPage.waitForTimeout(2000);
  }

  await adminPage.screenshot({ path: '../student_msg_in_admin_verified.png' });

  const adminBodyText = await adminPage.evaluate(() => document.body.innerText);
  console.log('\n=================== VERIFICATION: STUDENT MSG IN ADMIN PORTAL ===================');
  console.log('Admin Doubts page shows Monisha:', adminBodyText.includes('Monisha'));
  console.log('=================================================================================\n');

  await browser.close();
})();
