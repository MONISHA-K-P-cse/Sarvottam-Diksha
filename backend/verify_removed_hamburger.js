import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Loading home page...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const buttonCount = await page.locator('button[title="Open Navigation Menu"]').count();
  const headerButtonCount = await page.locator('button[title="Open/Close Navigation Sidebar"]').count();

  console.log('\n=================== VERIFICATION: REMOVED HAMBURGER ===================');
  console.log('Navbar Hamburger Button Count:', buttonCount);
  console.log('Admin Header Button Count:', headerButtonCount);
  console.log('Successfully Removed:', buttonCount === 0 && headerButtonCount === 0);
  console.log('=====================================================================\n');

  await browser.close();
})();
