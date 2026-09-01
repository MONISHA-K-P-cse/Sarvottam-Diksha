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
    window.localStorage.setItem('sd_token', 'demo_admin_token');
  });

  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click Courses sidebar
  const coursesSidebarBtn = page.locator('button:has-text("Courses")').first();
  await coursesSidebarBtn.click();
  await page.waitForTimeout(2000);

  const buttonDetails = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.map(b => ({
      text: b.textContent.trim(),
      outerHTML: b.outerHTML,
      parentText: b.parentElement ? b.parentElement.innerText : ''
    }));
  });

  console.log('--- ALL BUTTONS ON ADMIN COURSES TAB ---');
  console.log(JSON.stringify(buttonDetails, null, 2));

  await browser.close();
})();
