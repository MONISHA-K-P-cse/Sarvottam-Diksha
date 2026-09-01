import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'Laptop (1280px)', width: 1280, height: 800 },
    { name: 'Desktop (1440px)', width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    console.log(`\nTesting Navbar Account Details & Logout on ${vp.name}...`);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });

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
    await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const logoutBtn = page.locator('button:has-text("Logout")').first();
    const isLogoutVisible = await logoutBtn.isVisible();

    const accountBtn = page.locator('button[title*="Account Details"]').first();
    const isAccountVisible = await accountBtn.isVisible();

    const bodyText = await page.evaluate(() => document.body.innerText);

    console.log(`=================== VERIFICATION: ${vp.name.toUpperCase()} ===================`);
    console.log('User Name "Monisha K P" Visible:', bodyText.includes('Monisha K P'));
    console.log('Role "Student" Badge Visible:', bodyText.includes('Student'));
    console.log('Explicit "Logout" Button Visible:', isLogoutVisible);
    console.log('Account Details Card Clickable:', isAccountVisible);
    console.log('====================================================================\n');

    if (isLogoutVisible) {
      console.log('Clicking Logout Button to verify sign out...');
      await logoutBtn.click();
      await page.waitForTimeout(1500);

      const postLogoutText = await page.evaluate(() => document.body.innerText);
      console.log('Successfully Logged Out (Sign In Button Visible):', postLogoutText.includes('Sign In'));
    }

    await context.close();
  }

  await browser.close();
})();
