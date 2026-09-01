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

  await page.addInitScript(() => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_token');
  });

  console.log('1. Loading https://sarvottam-diksha.web.app/admin...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Extract course card details from DOM / state
  const courseDetails = await page.evaluate(() => {
    const manageBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Manage');
    if (!manageBtn) return null;

    // Find card container
    let cardEl = manageBtn.closest('.bg-white') || manageBtn.closest('.dark\\:bg-slate-900') || manageBtn.parentElement.parentElement;
    
    // Check local storage sd_courses or React state if available
    let storedCourses = [];
    try {
      storedCourses = JSON.parse(localStorage.getItem('sd_courses') || '[]');
    } catch (e) {}

    return {
      btnExists: true,
      cardText: cardEl ? cardEl.innerText : '',
      storedCoursesCount: storedCourses.length,
      firstStoredCourse: storedCourses[0] || null
    };
  });

  console.log('\n--- 1. COURSE CARD INSPECTION ---');
  console.log(JSON.stringify(courseDetails, null, 2));

  // Clear API requests list before clicking Manage
  apiRequests.length = 0;

  console.log('\n--- 2. CLICKING MANAGE BUTTON ---');
  const urlBefore = page.url();
  console.log('URL Before Click:', urlBefore);

  const manageBtn = page.locator('button:has-text("Manage")').first();
  await manageBtn.click();

  await page.waitForTimeout(3000);

  const urlAfter = page.url();
  console.log('URL After Click:', urlAfter);

  const destinationBodyText = await page.evaluate(() => document.body.innerText);

  console.log('\n--- 3. API REQUESTS AFTER CLICK ---');
  console.log(JSON.stringify(apiRequests, null, 2));

  console.log('\n--- 4. DESTINATION PAGE RENDER (First 500 chars) ---');
  console.log(destinationBodyText.substring(0, 500));

  await browser.close();
})();
