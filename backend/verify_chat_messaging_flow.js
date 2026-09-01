import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Context 1: Student Monisha K P
  const studentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await studentContext.addInitScript(() => {
    const studentUser = {
      id: 'student_monisha_777',
      name: 'Monisha K P',
      email: 'monisha@gmail.com',
      role: 'STUDENT'
    };
    window.localStorage.setItem('sd_user', JSON.stringify(studentUser));
    window.localStorage.setItem('user', JSON.stringify(studentUser));
    window.localStorage.setItem('sd_token', 'demo_student_token');
  });

  // Context 2: Admin Manika Ma'am
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await adminContext.addInitScript(() => {
    const adminUser = {
      id: 'admin_manika_1',
      name: 'Manika Maheshwari',
      email: 'manikamaam.maths@gmail.com',
      role: 'ADMIN'
    };
    window.localStorage.setItem('sd_user', JSON.stringify(adminUser));
    window.localStorage.setItem('user', JSON.stringify(adminUser));
    window.localStorage.setItem('sd_token', 'demo_admin_token');
  });

  const studentPage = await studentContext.newPage();
  const adminPage = await adminContext.newPage();

  console.log('1. Student (Monisha K P) navigating to Doubts Chat Inbox (/chats)...');
  await studentPage.goto('https://sarvottam-diksha.web.app/chats', { waitUntil: 'networkidle' });
  await studentPage.waitForTimeout(2000);

  console.log('2. Student typing and sending doubt to Manika Ma\'am...');
  const studentChatInput = studentPage.locator('input[placeholder*="doubt"], textarea[placeholder*="doubt"], input[type="text"]').first();
  await studentChatInput.fill("Hello Manika Ma'am! I have a doubt regarding Chapter 2 Quadratic Equations discriminant formula.");
  
  const studentSendBtn = studentPage.locator('button:has-text("Send"), button[type="submit"], button:has(svg)').last();
  await studentSendBtn.click();
  await studentPage.waitForTimeout(2000);

  console.log('3. Taking screenshot of Student Chat Inbox after sending message...');
  await studentPage.screenshot({ path: '../chat_student_sent_verified.png', fullPage: false });

  console.log('4. Admin (Manika Ma\'am) opening Admin Doubts Inbox (/chats)...');
  await adminPage.goto('https://sarvottam-diksha.web.app/chats', { waitUntil: 'networkidle' });
  await adminPage.waitForTimeout(2000);

  const adminPageContent = await adminPage.evaluate(() => document.body.innerText);
  console.log('Admin sees student message:', adminPageContent.includes("discriminant formula"));

  console.log('5. Admin (Manika Ma\'am) typing and sending reply to Student Monisha K P...');
  const adminChatInput = adminPage.locator('input[placeholder*="reply"], textarea, input[type="text"]').first();
  await adminChatInput.fill("Hello Monisha! The discriminant formula is D = b^2 - 4ac. If D > 0, roots are real & distinct. If D = 0, roots are equal!");

  const adminSendBtn = adminPage.locator('button:has-text("Send"), button[type="submit"], button:has(svg)').last();
  await adminSendBtn.click();
  await adminPage.waitForTimeout(2000);

  console.log('6. Taking screenshot of Admin (Manika Ma\'am) Inbox after replying...');
  await adminPage.screenshot({ path: '../chat_admin_reply_verified.png', fullPage: false });

  console.log('7. Verifying Student received Manika Ma\'am\'s reply live...');
  await studentPage.reload({ waitUntil: 'networkidle' });
  await studentPage.waitForTimeout(2000);

  const studentFinalContent = await studentPage.evaluate(() => document.body.innerText);

  console.log('\n=================== VERIFICATION: LIVE DOUBTS CHAT MESSAGING ===================');
  console.log('Student Message Sent Successfully:', studentFinalContent.includes("discriminant formula"));
  console.log('Teacher (Manika Ma\'am) Reply Received by Student:', studentFinalContent.includes("discriminant formula is D = b^2 - 4ac"));
  console.log('=================================================================================\n');

  await studentPage.screenshot({ path: '../chat_student_received_reply_verified.png', fullPage: false });

  await browser.close();
})();
