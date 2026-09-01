import { chromium } from 'playwright';

(async () => {
  console.log('1. Launching Playwright browser sessions...');
  const browser = await chromium.launch({ headless: true });

  const studentUser = {
    id: 'student_monisha_777',
    name: 'Monisha K P',
    email: 'monisha@gmail.com',
    role: 'STUDENT'
  };

  const adminUser = {
    id: '88261e1a-5267-4059-bb73-3e9a26585e7f',
    name: 'Manika Maheshwari',
    email: 'dikshasarvottam@gmail.com',
    role: 'ADMIN'
  };

  // Context 1: Student Monisha K P
  const studentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await studentContext.addInitScript(({ u, t }) => {
    window.localStorage.setItem('sd_user', JSON.stringify(u));
    window.localStorage.setItem('user', JSON.stringify(u));
    window.localStorage.setItem('sd_token', t);
  }, { u: studentUser, t: 'demo_student_token' });

  // Context 2: Admin Manika Ma'am
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await adminContext.addInitScript(({ u, t }) => {
    window.localStorage.setItem('sd_user', JSON.stringify(u));
    window.localStorage.setItem('user', JSON.stringify(u));
    window.localStorage.setItem('sd_token', t);
  }, { u: adminUser, t: 'demo_admin_token' });

  const studentPage = await studentContext.newPage();
  const adminPage = await adminContext.newPage();

  console.log('2. Student Monisha K P navigating to Doubts Inbox (/chats)...');
  await studentPage.goto('https://sarvottam-diksha.web.app/chats', { waitUntil: 'networkidle' });
  await studentPage.waitForTimeout(2000);

  console.log('3. Student typing doubt message to Manika Ma\'am...');
  const studentInput = studentPage.locator('input[placeholder*="Ask"]').first();
  await studentInput.click();
  await studentInput.pressSequentially("Hello Manika Ma'am! How do we calculate discriminant of 2x² - 5x + 3 = 0?", { delay: 15 });
  await studentPage.waitForTimeout(500);
  await studentPage.keyboard.press('Enter');
  await studentPage.waitForTimeout(2500);

  await studentPage.screenshot({ path: '../live_chat_student_doubt_verified.png' });

  console.log('4. Admin Manika Ma\'am opening Admin Doubts Inbox (/chats)...');
  await adminPage.goto('https://sarvottam-diksha.web.app/chats', { waitUntil: 'networkidle' });
  await adminPage.waitForTimeout(2500);

  await adminPage.screenshot({ path: '../live_chat_admin_roster_verified.png' });

  console.log('5. Admin replying to Student...');
  const adminInput = adminPage.locator('input[placeholder*="reply"], input[placeholder*="Type"], input[type="text"]').first();
  await adminInput.click();
  await adminInput.pressSequentially("Hello Monisha! For 2x² - 5x + 3 = 0, a=2, b=-5, c=3. Discriminant D = b² - 4ac = 1. Roots are real & distinct!", { delay: 15 });
  await adminPage.waitForTimeout(500);
  await adminPage.keyboard.press('Enter');
  await adminPage.waitForTimeout(2500);

  await adminPage.screenshot({ path: '../live_chat_admin_reply_verified.png' });

  console.log('6. Student reloading to check live reply...');
  await studentPage.reload({ waitUntil: 'networkidle' });
  await studentPage.waitForTimeout(2000);

  await studentPage.screenshot({ path: '../live_chat_student_reply_received.png' });

  await browser.close();
})();
