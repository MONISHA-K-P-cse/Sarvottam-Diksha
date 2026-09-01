import { chromium } from 'playwright';

(async () => {
  console.log('1. Launching Playwright to test test option visibility...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const adminUser = {
    id: '88261e1a-5267-4059-bb73-3e9a26585e7f',
    name: 'Manika Maheshwari',
    email: 'Dikshasarvottam@gmail.com',
    role: 'ADMIN'
  };

  await context.addInitScript(({ u, t }) => {
    window.localStorage.setItem('sd_user', JSON.stringify(u));
    window.localStorage.setItem('user', JSON.stringify(u));
    window.localStorage.setItem('sd_token', t);
  }, { u: adminUser, t: 'demo_admin_token' });

  const page = await context.newPage();

  console.log('2. Navigating to Admin Dashboard (/admin)...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Click on "Test Portal" card
  const testPortalCard = page.locator('text="Test Portal"').first();
  if (await testPortalCard.isVisible()) {
    await testPortalCard.click({ force: true });
    await page.waitForTimeout(2000);
  }

  // Click "+ Create Quiz for Library"
  const createBtn = page.locator('button:has-text("Create Quiz for Library")').first();
  if (await createBtn.isVisible()) {
    await createBtn.click({ force: true });
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: '../test_options_fixed_verified.png' });

  // Click "CBT Preview" inside builder if visible
  const previewBtn = page.locator('button:has-text("Preview CBT"), button:has-text("Preview")').first();
  if (await previewBtn.isVisible()) {
    await previewBtn.click({ force: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '../test_options_fixed_verified.png' });
  }

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n=================== VERIFICATION: TEST OPTIONS VISIBILITY ===================');
  console.log('Page body includes Option text:', bodyText.includes('Option A') || bodyText.includes('Option B') || bodyText.includes('QUESTION PALETTE') || bodyText.includes('Option'));
  console.log('=============================================================================\n');

  await browser.close();
})();
