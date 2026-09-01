import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Loading Admin Dashboard...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('2. Injecting sample folder and test items...');
  await page.evaluate(() => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_token');
    window.localStorage.setItem('sd_admin_active_tab', 'content');

    const demoFolder = { id: 'folder_to_delete_01', title: 'Class 10 Board Papers Folder', date: 'Recent' };
    localStorage.setItem('sd_test_folders', JSON.stringify([demoFolder]));

    const demoTest = { id: 'test_to_delete_01', title: 'Real Numbers Chapter Mock 01', date: 'Recent' };
    localStorage.setItem('sd_custom_tests', JSON.stringify([demoTest]));
  });

  console.log('3. Re-navigating to Admin Dashboard Content tab...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Auto-accept confirmation dialogs
  page.on('dialog', async dialog => {
    console.log('Auto-confirming dialog:', dialog.message());
    await dialog.accept();
  });

  console.log('4. Clicking Options (⋮) on the first item (Folder)...');
  await page.locator('td button').first().click();
  await page.waitForTimeout(500);

  console.log('5. Clicking Delete option...');
  await page.locator('button:has-text("Delete")').click();
  await page.waitForTimeout(1500);

  const remainingText = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== VERIFICATION: FOLDER & TEST DELETION ===================');
  console.log('Folder Successfully Deleted:', !remainingText.includes('Class 10 Board Papers Folder'));
  console.log('============================================================================\n');

  await browser.close();
})();
