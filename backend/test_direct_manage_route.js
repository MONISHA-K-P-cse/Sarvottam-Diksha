import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleLogs = [];
  const networkTrace = [];

  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    consoleLogs.push({ type: 'pageerror', text: err.stack || err.message });
    console.log(`[PAGE ERROR] ${err.stack || err.message}`);
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('/api/')) {
      let bodyText = '';
      try {
        bodyText = await res.text();
      } catch (e) {
        bodyText = '[unreadable]';
      }
      networkTrace.push({
        url,
        status: res.status(),
        contentType: res.headers()['content-type'] || '',
        isHTML: bodyText.trim().startsWith('<!DOCTYPE html>'),
        bodySnippet: bodyText.substring(0, 300)
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

  console.log('--- DIRECT NAVIGATION TEST TO MANAGE ROUTE ---');
  console.log('Navigating directly to https://sarvottam-diksha.web.app/admin/courses/c1/manage...');
  await page.goto('https://sarvottam-diksha.web.app/admin/courses/c1/manage', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  console.log('Final URL after direct goto:', page.url());

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n--- BODY TEXT ON DIRECT MANAGE ROUTE (first 600 chars) ---');
  console.log(bodyText.substring(0, 600));

  console.log('\n--- API NETWORK TRACE ON DIRECT MANAGE ROUTE ---');
  console.log(JSON.stringify(networkTrace, null, 2));

  await browser.close();
})();
