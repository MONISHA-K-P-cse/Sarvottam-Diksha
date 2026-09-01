import { chromium } from 'playwright';

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

  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const sidebarCourses = page.locator('aside button:has-text("Courses")').first();
  await sidebarCourses.click();
  await page.waitForTimeout(1500);

  console.log('--- TESTING PREVIEW CLICK ---');
  const cardPreviewBtn = page.locator('.group button:has-text("Preview")').first();
  await cardPreviewBtn.click();
  await page.waitForTimeout(1000);

  let text = await page.evaluate(() => document.body.innerText);
  console.log('Contains Student Portal Course Preview:', text.includes('Student Portal Course Preview'));
  console.log('Contains Close Preview:', text.includes('Close Preview'));

  const closeBtn = page.locator('button:has-text("Close Preview")').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(1000);
  }

  console.log('--- TESTING MANAGE CLICK ---');
  const cardManageBtn = page.locator('.group button:has-text("Manage")').first();
  await cardManageBtn.click();
  await page.waitForTimeout(1000);

  text = await page.evaluate(() => document.body.innerText);
  console.log('Contains Curriculum Chapters:', text.includes('Curriculum Chapters'));
  console.log('Contains Edit Details or Save Changes:', text.includes('Save') || text.includes('Edit'));

  await browser.close();
})();
