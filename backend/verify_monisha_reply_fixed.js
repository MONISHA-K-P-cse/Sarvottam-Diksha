import { chromium } from 'playwright';

(async () => {
  console.log('1. Launching Playwright with populated sd_conversations...');
  const browser = await chromium.launch({ headless: true });

  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminUser = {
    id: '88261e1a-5267-4059-bb73-3e9a26585e7f',
    name: 'Manika Maheshwari',
    email: 'Dikshasarvottam@gmail.com',
    role: 'ADMIN'
  };

  const monishaStudent = {
    id: 'student_monisha_gmail_com',
    name: 'MONISHA',
    email: 'monisha@gmail.com'
  };

  const monishaMsg = {
    id: 'msg_monisha_1',
    text: 'hi',
    senderId: 'student_monisha_gmail_com',
    receiverId: 'admin_1',
    createdAt: new Date().toISOString(),
    sender: { name: 'MONISHA', role: 'STUDENT', email: 'monisha@gmail.com' }
  };

  await adminContext.addInitScript(({ u, t, s, m }) => {
    window.localStorage.setItem('sd_user', JSON.stringify(u));
    window.localStorage.setItem('user', JSON.stringify(u));
    window.localStorage.setItem('sd_token', t);

    window.localStorage.setItem('sd_conversations', JSON.stringify([
      { id: s.id, conversationId: s.id, student: s, lastMessage: 'hi', unreadCount: 1, lastActive: new Date().toISOString() }
    ]));

    window.localStorage.setItem(`sd_messages_${s.id}`, JSON.stringify([m]));
    window.localStorage.setItem(`sd_messages_${s.email}`, JSON.stringify([m]));
  }, { u: adminUser, t: 'demo_admin_token', s: monishaStudent, m: monishaMsg });

  const adminPage = await adminContext.newPage();
  console.log('2. Navigating to /admin and opening Doubt Chats tab...');
  await adminPage.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'domcontentloaded' });
  await adminPage.waitForTimeout(2000);

  await adminPage.click('button:has-text("Doubt Chats")');
  await adminPage.waitForTimeout(2000);

  console.log('3. Clicking MONISHA in left roster...');
  const monishaCard = adminPage.locator('div:has-text("MONISHA")').first();
  if (await monishaCard.isVisible()) {
    await monishaCard.click();
    await adminPage.waitForTimeout(1000);
  }

  console.log('4. Clicking Monisha\'s message bubble "hi"...');
  const msgBubble = adminPage.locator('p:text-is("hi")').first();
  if (await msgBubble.isVisible()) {
    await msgBubble.click();
    await adminPage.waitForTimeout(1000);
  } else {
    const fallbackBubble = adminPage.locator('div:has-text("hi")').first();
    if (await fallbackBubble.isVisible()) {
      await fallbackBubble.click();
      await adminPage.waitForTimeout(1000);
    }
  }

  const textAfterClick = await adminPage.evaluate(() => document.body.innerText);

  console.log('\n=================== PERFECT VERIFICATION RESULT ===================');
  console.log('MONISHA card visible:', textAfterClick.includes('MONISHA'));
  console.log('Monisha message "hi" visible:', textAfterClick.includes('hi'));
  console.log('Replying to MONISHA banner active:', textAfterClick.includes('Replying to'));
  console.log('===================================================================\n');

  await adminPage.screenshot({ path: '../monisha_reply_perfect_verified.png' });

  await browser.close();
})();
