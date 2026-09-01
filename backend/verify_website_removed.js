import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log('1. Opening Admin Dashboard...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    localStorage.setItem('sd_token', 'demo_admin_jwt');
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const checkResults = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasWebsiteSidebar = Array.from(document.querySelectorAll('button span')).some(el => el.innerText.trim() === 'Website');
    const hasCreateWebsiteBanner = text.includes('Create Website') || text.includes('Create your personalized website & portals');
    return { hasWebsiteSidebar, hasCreateWebsiteBanner };
  });

  console.log(`\n=======================================================`);
  console.log(`🌐 WEBSITE SIDEBAR ITEM REMOVED: ${!checkResults.hasWebsiteSidebar ? 'SUCCESS' : 'FAILED'}`);
  console.log(`✨ CREATE WEBSITE BANNER REMOVED: ${!checkResults.hasCreateWebsiteBanner ? 'SUCCESS' : 'FAILED'}`);
  console.log(`=======================================================\n`);

  const screenshotPath = path.join(process.cwd(), 'e2e_test_reports', 'website_removed_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();
})();
