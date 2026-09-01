import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

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

  // Click Courses sidebar button
  const coursesSidebarBtn = page.locator('button:has-text("Courses")').first();
  await coursesSidebarBtn.click();
  await page.waitForTimeout(2000);

  // Fetch the exact courses list from window / state
  const coursesData = await page.evaluate(() => {
    // Intercept navigate function by wrapping window.history or clicking and catching route
    let coursesList = [];
    
    // Find all Manage buttons
    const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === 'Manage');
    
    return {
      manageButtonsCount: btns.length,
      sampleCardHTML: btns[0] ? btns[0].parentElement.parentElement.innerText : ''
    };
  });

  console.log('--- COURSES DATA ON PAGE ---');
  console.log(JSON.stringify(coursesData, null, 2));

  // Click the Manage button on the first course card
  console.log('\n--- CLICKING MANAGE BUTTON ---');
  
  let navigatedUrl = null;
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      navigatedUrl = frame.url();
      console.log('Main frame navigated to:', navigatedUrl);
    }
  });

  const firstManageBtn = page.locator('button:has-text("Manage")').first();
  await firstManageBtn.click();

  await page.waitForTimeout(3000);

  console.log('URL after clicking Manage:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Body Text Snippet after click:\n', bodyText.substring(0, 400));

  await browser.close();
})();
