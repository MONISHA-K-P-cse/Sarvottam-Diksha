import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Setting up Admin Session...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_token');
    window.localStorage.setItem('sd_admin_active_tab', 'content');
  });

  console.log('2. Re-navigating to Admin Dashboard Content tab...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  console.log('3. Clicking Options button (⋮) in Test Portal table...');
  const optionsBtn = page.locator('td button').first();
  await optionsBtn.click();
  await page.waitForTimeout(1000);

  const menuText = await page.evaluate(() => {
    const pop = document.querySelector('div[class*="absolute right-4 top-12"]');
    return pop ? pop.innerText : 'Menu not found';
  });

  console.log('\n=================== VERIFICATION: DELETE OPTION ===================');
  console.log('Options Menu Text:\n', menuText);
  console.log('Contains "Add":', menuText.includes('Add'));
  console.log('Contains "Test Stats":', menuText.includes('Test Stats'));
  console.log('Contains "Delete":', menuText.includes('Delete'));
  console.log('===================================================================\n');

  await browser.close();
})();
