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

  // Intercept navigate or inspect course object in DOM
  const coursesInState = await page.evaluate(() => {
    const storedCustom = JSON.parse(localStorage.getItem('sd_custom_courses') || '[]');
    const storedCourses = JSON.parse(localStorage.getItem('sd_courses') || '[]');

    // Search React Fiber node on the course catalog element
    const cards = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === 'Manage');
    const cardData = cards.map((btn, index) => {
      const parent = btn.closest('.bg-white') || btn.closest('.dark\\:bg-slate-900') || btn.parentElement.parentElement;
      return {
        index,
        cardText: parent ? parent.innerText.split('\n') : []
      };
    });

    return {
      storedCustom,
      storedCourses,
      cardData
    };
  });

  console.log('--- ALL COURSES IN LOCAL STORAGE & DOM CARDS ---');
  console.log(JSON.stringify(coursesInState, null, 2));

  // Now, let's attach an event listener to window or patch history.pushState / react router to see what navigate() call receives!
  await page.evaluate(() => {
    const origPushState = history.pushState;
    history.pushState = function(...args) {
      console.log('PUSHSTATE CALLED WITH:', args[2]);
      return origPushState.apply(this, args);
    };

    window.addEventListener('popstate', (e) => {
      console.log('POPSTATE EVENT FIRED:', window.location.href);
    });
  });

  console.log('\n--- CLICKING MANAGE BUTTON NOW ---');
  const manageBtn = page.locator('button:has-text("Manage")').first();
  await manageBtn.click();
  await page.waitForTimeout(3000);

  console.log('URL After Click:', page.url());

  await browser.close();
})();
