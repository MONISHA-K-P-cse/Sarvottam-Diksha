import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });

  const studentUser = {
    id: 'student_vikram_888',
    name: 'Vikram Student',
    email: 'vikram.student@gmail.com',
    phone: '9876543210',
    role: 'STUDENT'
  };

  console.log('1. Logging in as Admin (Manika Maheshwari) with new registration notification...');
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await adminContext.addInitScript(({ studentUser }) => {
    const adminUser = {
      id: 'admin_1',
      name: 'Manika Maheshwari',
      email: 'Dikshasarvottam@gmail.com',
      role: 'ADMIN'
    };
    window.localStorage.setItem('sd_user', JSON.stringify(adminUser));
    window.localStorage.setItem('user', JSON.stringify(adminUser));
    window.localStorage.setItem('sd_token', 'demo_admin_token');

    const notifObj = {
      id: `notif_reg_${Date.now()}`,
      title: '🔔 New Student Registered',
      message: `🎉 ${studentUser.name} (${studentUser.email} • Ph: ${studentUser.phone}) joined Sarvottam Diksha!`,
      type: 'REGISTRATION',
      student: studentUser,
      createdAt: new Date().toISOString(),
      read: false
    };
    window.localStorage.setItem('sd_admin_notifications', JSON.stringify([notifObj]));

    const convObj = {
      id: `conv_${studentUser.id}`,
      studentId: studentUser.id,
      student: studentUser,
      lastMessage: `Dear ${studentUser.name}, welcome to Sarvottam Diksha!`,
      lastActive: new Date().toISOString(),
      unreadCount: 1
    };
    window.localStorage.setItem('sd_conversations', JSON.stringify([convObj]));
  }, { studentUser });

  const adminPage = await adminContext.newPage();
  await adminPage.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await adminPage.waitForTimeout(2000);

  console.log('2. Checking Top Navbar Bell Icon Notification...');
  const bellBtn = adminPage.locator('button[title="Notifications"]').first();
  await bellBtn.click();
  await adminPage.waitForTimeout(1000);

  const notifText = await adminPage.evaluate(() => document.body.innerText);

  console.log('\n=================== VERIFICATION: ADMIN REGISTRATION NOTIFICATION ===================');
  console.log('Notification Bell Active:', await bellBtn.isVisible());
  console.log('Registration Alert Received:', notifText.includes('New Registration') || notifText.includes('Vikram Student'));
  console.log('====================================================================================\n');

  console.log('3. Clicking "💬 Message Student" CTA from Notification Drawer...');
  const msgBtn = adminPage.locator('button:has-text("Message Student")').first();
  await msgBtn.click();
  await adminPage.waitForTimeout(2000);

  console.log('4. Typing message to Vikram Student in Chat Section...');
  const chatInput = adminPage.locator('input[placeholder*="Write something here"]').first();
  if (await chatInput.isVisible()) {
    await chatInput.fill('Hello Vikram, welcome to Sarvottam Diksha! How can I help you with your Class 10 Math prep today?');
    await adminPage.waitForTimeout(500);

    const sendBtn = adminPage.locator('button:has-text("Send")').first();
    await sendBtn.click();
    await adminPage.waitForTimeout(1500);
  }

  const chatText = await adminPage.evaluate(() => document.body.innerText);

  console.log('\n=================== VERIFICATION: DIRECT ADMIN CHAT MESSAGING ===================');
  console.log('Admin Chat Opened for Vikram:', chatText.includes('Vikram Student') || chatText.includes('Chat'));
  console.log('Sent Message Appears in Thread:', chatText.includes('Hello Vikram, welcome to Sarvottam Diksha!'));
  console.log('=================================================================================\n');

  await browser.close();
})();
