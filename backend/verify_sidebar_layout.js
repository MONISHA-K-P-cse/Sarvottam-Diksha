import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addInitScript(() => {
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

  const page = await context.newPage();
  console.log('1. Navigating to Sarvottam Diksha Web Portal...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  console.log('2. Checking Sidebar & Top Header elements...');
  const sidebar = page.locator('aside').first();
  const isSidebarVisible = await sidebar.isVisible();

  const sidebarText = await sidebar.evaluate(el => el.innerText);

  console.log('\n=================== VERIFICATION: APP SIDEBAR NAVIGATION ===================');
  console.log('Left Sidebar Active:', isSidebarVisible);
  console.log('Contains Logo & Math Academy:', sidebarText.includes('MATH ACADEMY'));
  console.log('Contains "Home Dashboard":', sidebarText.includes('Home Dashboard'));
  console.log('Contains "Course Catalog":', sidebarText.includes('Course Catalog'));
  console.log('Contains "Free Tests":', sidebarText.includes('Free Tests'));
  console.log('Contains "Doubts Inbox":', sidebarText.includes('Doubts Inbox'));
  console.log('Contains "Leaderboard":', sidebarText.includes('Leaderboard'));
  console.log('Contains "My Enrolled Courses":', sidebarText.includes('My Enrolled Courses'));
  console.log('Contains Bottom User "Monisha K P":', sidebarText.includes('Monisha K P'));
  console.log('Contains Direct "Log Out" Button:', sidebarText.includes('Log Out'));
  console.log('===========================================================================\n');

  console.log('3. Taking verification screenshot of the new layout...');
  await page.screenshot({ path: '../sidebar_layout_verified.png', fullPage: false });

  await browser.close();
})();
