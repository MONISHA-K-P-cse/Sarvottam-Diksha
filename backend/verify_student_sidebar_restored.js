import { chromium } from 'playwright';

(async () => {
  console.log('1. Launching Playwright to test student sidebar visibility...');
  const browser = await chromium.launch({ headless: true });

  // Test Case A: Logged in Student MONISHA on Homepage /
  const studentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const studentUser = {
    id: 'student_monisha_gmail_com',
    name: 'MONISHA',
    email: 'monisha@gmail.com',
    role: 'STUDENT'
  };

  await studentContext.addInitScript(({ u, t }) => {
    window.localStorage.setItem('sd_user', JSON.stringify(u));
    window.localStorage.setItem('user', JSON.stringify(u));
    window.localStorage.setItem('sd_token', t);
  }, { u: studentUser, t: 'demo_token' });

  const studentPage = await studentContext.newPage();
  console.log('2. Student MONISHA navigating to /...');
  await studentPage.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'domcontentloaded' });
  await studentPage.waitForTimeout(2000);

  const studentBodyText = await studentPage.evaluate(() => document.body.innerText);
  const studentSidebarNav = await studentPage.locator('aside nav').isVisible();

  await studentPage.screenshot({ path: '../student_sidebar_homepage_verified.png' });

  // Test Case B: Guest user on Homepage /
  const guestContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const guestPage = await guestContext.newPage();
  console.log('3. Guest user navigating to /...');
  await guestPage.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'domcontentloaded' });
  await guestPage.waitForTimeout(2000);

  const guestSidebarNav = await guestPage.locator('aside nav').isVisible();

  console.log('\n=================== VERIFICATION RESULT ===================');
  console.log('Logged-in Student Home Dashboard has Sidebar Nav:', studentSidebarNav);
  console.log('Logged-in Student Page contains "Home Dashboard":', studentBodyText.includes('Home Dashboard'));
  console.log('Guest Visitor Homepage has Sidebar Nav:', guestSidebarNav);
  console.log('===========================================================\n');

  await browser.close();
})();
