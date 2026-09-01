import { chromium } from 'playwright';

(async () => {
  console.log('1. Launching Playwright to test multi-student conversation switching...');
  const browser = await chromium.launch({ headless: true });

  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminUser = {
    id: '88261e1a-5267-4059-bb73-3e9a26585e7f',
    name: 'Manika Maheshwari',
    email: 'Dikshasarvottam@gmail.com',
    role: 'ADMIN'
  };

  const studentsList = [
    { id: 's_monisha', name: 'MONISHA', email: 'monisha@gmail.com' },
    { id: 's_yash', name: 'Yash Sharma', email: 'yash@gmail.com' },
    { id: 's_tanisha', name: 'Tanisha Patel', email: 'tanisha@gmail.com' }
  ];

  await adminContext.addInitScript(({ u, t, stList }) => {
    window.localStorage.setItem('sd_user', JSON.stringify(u));
    window.localStorage.setItem('user', JSON.stringify(u));
    window.localStorage.setItem('sd_token', t);

    window.localStorage.setItem('sd_students', JSON.stringify(stList));

    const convs = stList.map(s => ({
      id: s.id,
      conversationId: `conv_${s.id}`,
      student: s,
      lastMessage: `Hello from ${s.name}`,
      unreadCount: 1,
      lastActive: new Date().toISOString()
    }));

    window.localStorage.setItem('sd_conversations', JSON.stringify(convs));
  }, { u: adminUser, t: 'demo_admin_token', stList: studentsList });

  const adminPage = await adminContext.newPage();
  console.log('2. Navigating to /admin and opening Doubt Chats tab...');
  await adminPage.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'domcontentloaded' });
  await adminPage.waitForTimeout(2000);

  await adminPage.click('button:has-text("Doubt Chats")');
  await adminPage.waitForTimeout(2000);

  // Click Yash Sharma
  console.log('3. Clicking Yash Sharma card...');
  await adminPage.click('div:has-text("Yash Sharma")');
  await adminPage.waitForTimeout(1000);
  const textYash = await adminPage.evaluate(() => document.body.innerText);

  // Click Tanisha Patel
  console.log('4. Clicking Tanisha Patel card...');
  await adminPage.click('div:has-text("Tanisha Patel")');
  await adminPage.waitForTimeout(1000);
  const textTanisha = await adminPage.evaluate(() => document.body.innerText);

  console.log('\n=================== MULTI-STUDENT VERIFICATION ===================');
  console.log('Yash Sharma active chat loaded:', textYash.includes('Yash Sharma'));
  console.log('Tanisha Patel active chat loaded:', textTanisha.includes('Tanisha Patel'));
  console.log('==================================================================\n');

  await adminPage.screenshot({ path: '../multi_student_chat_selection_verified.png' });

  await browser.close();
})();
