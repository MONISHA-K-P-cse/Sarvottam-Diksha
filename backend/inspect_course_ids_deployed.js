import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

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

  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click Courses sidebar
  const coursesSidebarBtn = page.locator('button:has-text("Courses")').first();
  await coursesSidebarBtn.click();
  await page.waitForTimeout(2000);

  // Inspect the exact React Fiber node on the Manage button of the first course card!
  const fiberInspection = await page.evaluate(() => {
    const manageBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Manage');
    if (!manageBtn) return { error: 'No Manage button found' };

    // Traverse up react fiber to find onClick props and course object
    let key = Object.keys(manageBtn).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactProps$'));
    let node = manageBtn[key];

    let onClickFnStr = '';
    let memoizedProps = null;
    let currentFiber = node;

    while (currentFiber) {
      if (currentFiber.memoizedProps && currentFiber.memoizedProps.onClick) {
        onClickFnStr = currentFiber.memoizedProps.onClick.toString();
      }
      if (currentFiber.memoizedProps && currentFiber.memoizedProps.course) {
        memoizedProps = currentFiber.memoizedProps.course;
        break;
      }
      currentFiber = currentFiber.return;
    }

    return {
      onClickFnStr,
      memoizedProps
    };
  });

  console.log('--- REACT FIBER INSPECTION FOR MANAGE BUTTON ---');
  console.log(JSON.stringify(fiberInspection, null, 2));

  // Let's also trigger the click and log window.location change attempt
  console.log('\n--- CLICKING MANAGE BUTTON ---');
  const manageBtn = page.locator('button:has-text("Manage")').first();
  
  // Intercept window.location or navigate
  await page.evaluate(() => {
    window.lastNavigatedUrl = null;
    const originalPushState = history.pushState;
    history.pushState = function(state, unused, url) {
      window.lastNavigatedUrl = url;
      console.log('INTERCEPTED PUSHSTATE TO:', url);
      return originalPushState.apply(this, arguments);
    };
  });

  await manageBtn.click();
  await page.waitForTimeout(1000);

  const lastUrl = await page.evaluate(() => window.lastNavigatedUrl);
  console.log('Intercepted navigation URL:', lastUrl);
  console.log('Actual page URL after click:', page.url());

  await browser.close();
})();
