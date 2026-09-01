import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const logs = [];
  const networkRequests = [];

  page.on('console', msg => {
    logs.push(`[CONSOLE ${msg.type()}] ${msg.text()}`);
    console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    logs.push(`[PAGE ERROR] ${err.stack || err.message}`);
    console.log(`[PAGE ERROR] ${err.stack || err.message}`);
  });

  page.on('request', req => {
    networkRequests.push({ type: 'req', url: req.url(), method: req.method() });
  });

  page.on('response', async res => {
    let bodySnippet = '';
    let contentType = res.headers()['content-type'] || '';
    try {
      const text = await res.text();
      bodySnippet = text.substring(0, 300);
    } catch (e) {
      bodySnippet = '[Could not read body]';
    }
    networkRequests.push({
      type: 'res',
      url: res.url(),
      status: res.status(),
      contentType: contentType,
      bodySnippet: bodySnippet
    });
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

  console.log('--- Step 1: Navigating to Deployed Admin Portal (https://sarvottam-diksha.web.app/admin)...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('--- Step 2: Navigating to Courses tab / Course Catalog...');
  // Click on Courses menu if needed or check if course card is visible
  const coursesMenu = page.locator('button:has-text("Courses"), span:has-text("Courses")').first();
  if (await coursesMenu.isVisible()) {
    await coursesMenu.click();
    await page.waitForTimeout(1500);
  }

  // Find all Manage buttons currently on course cards
  const manageButtons = page.locator('button:has-text("Manage")');
  const count = await manageButtons.count();
  console.log(`Found ${count} "Manage" buttons on page.`);

  // Extract info from the first course card
  const firstCardText = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Manage');
    if (!btn) return 'NO MANAGE BUTTON FOUND';
    const card = btn.closest('.bg-white') || btn.closest('div');
    return card ? card.innerText : 'NO CARD PARENT FOUND';
  });
  console.log('First Course Card Text:\n', firstCardText);

  // Clear previous requests list to focus on click network trace
  networkRequests.length = 0;

  const urlBeforeClick = page.url();
  console.log('URL before Manage click:', urlBeforeClick);

  let clicked = false;
  try {
    const manageBtn = manageButtons.first();
    if (await manageBtn.isVisible()) {
      console.log('--- Step 3: Clicking Manage button on deployed website...');
      await manageBtn.click();
      clicked = true;
    } else {
      console.log('Manage button not visible directly, trying JS click...');
      clicked = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Manage');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
    }
  } catch (err) {
    console.log('Error clicking Manage button:', err);
  }

  await page.waitForTimeout(3000);

  const urlAfterClick = page.url();
  console.log('URL after Manage click:', urlAfterClick);

  const bodyTextAfterClick = await page.evaluate(() => document.body.innerText);
  console.log('Body text snippet after click:\n', bodyTextAfterClick.substring(0, 500));

  console.log('\n--- NETWORK REQUESTS MADE AFTER CLICK ---');
  console.log(JSON.stringify(networkRequests, null, 2));

  await browser.close();
})();
