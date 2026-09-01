import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Loading home page as guest user...');
  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('2. Clicking Hamburger menu button (☰)...');
  const menuBtn = page.locator('button[title="Open Navigation Menu"]').first();
  await menuBtn.click();
  await page.waitForTimeout(1500);

  const drawerText = await page.evaluate(() => {
    const el = document.querySelector('.animate-slide-right') || document.querySelector('div[class*="max-w-xs"]');
    return el ? el.innerText : 'Drawer not open';
  });

  console.log('\n=================== VERIFICATION: HAMBURGER SIDEBAR ===================');
  console.log('Drawer Open Text Sample:\n', drawerText.substring(0, 300));
  console.log('======================================================================\n');

  await browser.close();
})();
