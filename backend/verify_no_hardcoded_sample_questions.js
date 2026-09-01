import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Setting up Admin session & navigating to Quiz Creator...');
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

  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('2. Clicking "Create" or opening test portal workspace...');
  const createBtn = page.locator('button:has-text("Create"), button:has-text("Quiz")').first();
  if (await createBtn.isVisible()) {
    await createBtn.click();
    await page.waitForTimeout(1500);
  }

  const canvasText = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== VERIFICATION: ZERO HARDCODED QUESTIONS ===================');
  console.log('Contains "Express 25 mm as cm":', canvasText.includes('Express 25 mm as cm'));
  console.log('Contains "No Questions Added Yet":', canvasText.includes('No Questions Added Yet') || canvasText.includes('No questions'));
  console.log('==============================================================================\n');

  await browser.close();
})();
