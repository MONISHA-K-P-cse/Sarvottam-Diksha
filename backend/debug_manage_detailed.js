import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleLogs = [];
  const networkTrace = [];

  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', err => {
    consoleLogs.push({ type: 'pageerror', text: err.stack || err.message });
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('/api/')) {
      let bodyText = '';
      try {
        bodyText = await res.text();
      } catch (e) {
        bodyText = '[body unreadable]';
      }
      networkTrace.push({
        url: url,
        status: res.status(),
        contentType: res.headers()['content-type'] || '',
        body: bodyText
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

  console.log('Navigating to deployed Admin Dashboard...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Navigate to Courses tab inside Admin Dashboard if needed
  await page.evaluate(() => {
    const navButtons = Array.from(document.querySelectorAll('button'));
    const coursesNav = navButtons.find(b => b.textContent.includes('Courses'));
    if (coursesNav) coursesNav.click();
  });
  await page.waitForTimeout(1500);

  // Inspect the first course card on screen
  const cardData = await page.evaluate(() => {
    const manageBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Manage');
    if (!manageBtn) return null;

    // Get react props / state or DOM text surrounding
    const cardEl = manageBtn.closest('.bg-white') || manageBtn.closest('.dark\\:bg-slate-900') || manageBtn.parentElement.parentElement;
    
    // Check if React fiber contains course object
    let fiberKey = Object.keys(manageBtn).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactProps'));
    let reactProps = fiberKey ? manageBtn[fiberKey] : null;

    return {
      cardText: cardEl ? cardEl.innerText : '',
      btnOuterHTML: manageBtn.outerHTML,
      hasOnClick: !!manageBtn.onclick || true
    };
  });

  console.log('--- CARD DATA INSPECTION ---');
  console.log(JSON.stringify(cardData, null, 2));

  // Now click the Manage button on the first course card
  console.log('\n--- CLICKING MANAGE BUTTON ---');
  const initialUrl = page.url();
  
  // Intercept window.location or navigate call by listening to page URL change
  const manageBtnLocator = page.locator('button:has-text("Manage")').first();
  const btnCount = await manageBtnLocator.count();
  console.log('Manage button count:', btnCount);

  let clickFired = false;
  if (btnCount > 0) {
    await manageBtnLocator.click();
    clickFired = true;
  }

  await page.waitForTimeout(3000);

  const finalUrl = page.url();
  console.log('Initial URL:', initialUrl);
  console.log('Final URL after click:', finalUrl);

  const pageBodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n--- PAGE CONTENT AFTER CLICK (first 600 chars) ---');
  console.log(pageBodyText.substring(0, 600));

  console.log('\n--- CONSOLE LOGS ---');
  console.log(JSON.stringify(consoleLogs, null, 2));

  console.log('\n--- API NETWORK TRACE AFTER CLICK ---');
  console.log(JSON.stringify(networkTrace, null, 2));

  await browser.close();
})();
