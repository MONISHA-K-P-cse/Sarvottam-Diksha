import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.on('dialog', async dialog => {
    console.log(`[ALERT]: ${dialog.message()}`);
    await dialog.accept();
  });

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
  await page.waitForTimeout(1500);

  // Click + Create Quiz
  const createQuizBtn = page.locator('button:has-text("+ Create Quiz")').first();
  if (await createQuizBtn.isVisible()) {
    await createQuizBtn.click({ force: true });
    await page.waitForTimeout(1000);
  }

  // Type title
  const titleInput = page.locator('#testTitleInput').first();
  if (await titleInput.isVisible()) {
    await titleInput.fill('DIAGNOSTIC TEST 999');
  }

  // Click Save & Publish Test
  const publishBtn = page.locator('button:has-text("Save & Publish Test")').first();
  if (await publishBtn.isVisible()) {
    await publishBtn.click({ force: true });
    await page.waitForTimeout(2500);
  }

  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('--- PAGE TEXT DUMP ---');
  console.log(pageText.slice(0, 2000));

  const storedTests = await page.evaluate(() => localStorage.getItem('sd_custom_tests'));
  console.log('--- LOCALSTORAGE SD_CUSTOM_TESTS ---');
  console.log(storedTests);

  await browser.close();
})();
