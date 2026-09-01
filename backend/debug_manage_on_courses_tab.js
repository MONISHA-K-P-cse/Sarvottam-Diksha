import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const apiRequests = [];
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('/api/')) {
      let bodySnippet = '';
      try {
        bodySnippet = await res.text();
      } catch (e) {
        bodySnippet = '[body unreadable]';
      }
      apiRequests.push({
        url: url,
        status: res.status(),
        contentType: res.headers()['content-type'] || '',
        isHTML: bodySnippet.trim().startsWith('<!DOCTYPE html>'),
        bodySnippet: bodySnippet.substring(0, 250)
      });
    }
  });

  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push(err.stack || err.message);
  });

  await page.addInitScript(() => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_token');
  });

  console.log('1. Loading Admin Dashboard (https://sarvottam-diksha.web.app/admin)...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('2. Clicking "Courses" sidebar button...');
  const coursesSidebarBtn = page.locator('button:has-text("Courses")').first();
  await coursesSidebarBtn.click();
  await page.waitForTimeout(2000);

  // Inspect the first Course Card currently visible on the deployed page
  const courseCardInfo = await page.evaluate(() => {
    const manageBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Manage');
    if (!manageBtn) return { found: false };

    // Get closest course card container
    let card = manageBtn.closest('.bg-white') || manageBtn.closest('.dark\\:bg-slate-900') || manageBtn.parentElement.parentElement;
    
    // Inspect DOM attributes and text content of course card
    return {
      found: true,
      cardText: card ? card.innerText : '',
      btnOuterHTML: manageBtn.outerHTML,
      hasOnClick: true
    };
  });

  console.log('\n--- EXACT DEPLOYED COURSE CARD DATA ---');
  console.log(JSON.stringify(courseCardInfo, null, 2));

  // Also get the course array from React component state or LocalStorage to see the exact course object passed to the card
  const exactCourseObject = await page.evaluate(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sd_courses') || '[]');
      return stored.length > 0 ? stored[0] : null;
    } catch (e) {
      return null;
    }
  });

  console.log('\n--- EXACT COURSE OBJECT FOR FIRST CARD ---');
  console.log(JSON.stringify(exactCourseObject, null, 2));

  // Clear network logs before click
  apiRequests.length = 0;

  console.log('\n--- 3. CLICKING MANAGE BUTTON ---');
  const urlBeforeClick = page.url();
  console.log('URL Before Click:', urlBeforeClick);

  const manageButtonLocator = page.locator('button:has-text("Manage")').first();
  await manageButtonLocator.click();

  await page.waitForTimeout(3000);

  const urlAfterClick = page.url();
  console.log('URL After Click:', urlAfterClick);

  const bodyTextAfterClick = await page.evaluate(() => document.body.innerText);

  console.log('\n--- 4. API REQUESTS TRIGGERED AFTER CLICK ---');
  console.log(JSON.stringify(apiRequests, null, 2));

  console.log('\n--- 5. PAGE ERRORS (IF ANY) ---');
  console.log(JSON.stringify(pageErrors, null, 2));

  console.log('\n--- 6. DESTINATION PAGE RENDERED TEXT (First 600 chars) ---');
  console.log(bodyTextAfterClick.substring(0, 600));

  await browser.close();
})();
