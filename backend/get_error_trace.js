import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.stack || err.message));

  await page.addInitScript(() => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_token');
  });

  await page.goto('https://sarvottam-diksha.web.app/admin?bannerModal=true', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const titleInput = page.locator('input[placeholder*="Board Exam Target"]').first();
  await titleInput.fill('Class 10 CBSE Math Olympiad Special Banner');

  const submitBtn = page.locator('button:has-text("Publish New Banner Live")').first();
  await submitBtn.click();
  await page.waitForTimeout(2000);

  const detailsText = await page.evaluate(() => {
    const details = document.querySelector('details');
    return details ? details.innerText : document.body.innerText;
  });

  console.log('=== EXACT STACK TRACE FROM ERROR BOUNDARY ===');
  console.log(detailsText);

  await browser.close();
})();
