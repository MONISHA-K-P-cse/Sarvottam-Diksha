import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_token');
  });

  console.log('1. Loading Admin Dashboard (https://sarvottam-diksha.web.app/admin)...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const initialSidebarVisible = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    return aside ? !aside.classList.contains('hidden') : false;
  });
  console.log('Initial Sidebar Visible:', initialSidebarVisible);

  console.log('2. Clicking 3-lines Hamburger button (☰) to close Admin Sidebar...');
  const menuBtn = page.locator('button[title="Open/Close Navigation Sidebar"]').first();
  await menuBtn.click();
  await page.waitForTimeout(1000);

  const sidebarVisibleAfterFirstClick = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    return aside ? !aside.classList.contains('hidden') : false;
  });
  console.log('Sidebar Visible After 1st Click:', sidebarVisibleAfterFirstClick);

  console.log('3. Clicking 3-lines Hamburger button (☰) again to re-open Admin Sidebar...');
  await menuBtn.click();
  await page.waitForTimeout(1000);

  const sidebarVisibleAfterSecondClick = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    return aside ? !aside.classList.contains('hidden') : false;
  });
  console.log('Sidebar Visible After 2nd Click:', sidebarVisibleAfterSecondClick);

  console.log('\n=================== VERIFICATION RESULT ===================');
  console.log('Toggles correctly between OPEN and CLOSE:', initialSidebarVisible === true && sidebarVisibleAfterFirstClick === false && sidebarVisibleAfterSecondClick === true);
  console.log('===========================================================');

  await browser.close();
})();
