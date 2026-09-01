import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.addInitScript(() => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_jwt');
  });

  console.log('1. Opening Admin Dashboard...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const hasConnectDomain = await page.evaluate(() => {
    return document.body.innerText.includes('Connect Domain');
  });

  const hasAbhyaasClass8 = await page.evaluate(() => {
    return document.body.innerText.includes('ABHYAAS Class 8_ Linear Equation');
  });

  console.log(`\n=======================================================`);
  console.log(`🚫 CONNECT DOMAIN CARD REMOVED: ${!hasConnectDomain ? 'SUCCESS - REMOVED!' : 'FAILED'}`);
  console.log(`🚫 HARDCODED TESTS TABLE REMOVED: ${!hasAbhyaasClass8 ? 'SUCCESS - REMOVED!' : 'FAILED'}`);
  console.log(`=======================================================\n`);

  const screenshotPath = path.join(process.cwd(), 'e2e_test_reports', 'hardcoded_elements_removed_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();
})();
