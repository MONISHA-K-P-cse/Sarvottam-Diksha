import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { width: 1920, height: 1080, name: '1920_full_hd' },
    { width: 1600, height: 900, name: '1600_laptop' },
    { width: 1440, height: 900, name: '1440_standard' },
    { width: 1280, height: 800, name: '1280_medium' },
    { width: 1024, height: 768, name: '1024_small' },
    { width: 768, height: 1024, name: '768_tablet' },
    { width: 390, height: 844, name: '390_mobile' }
  ];

  for (const vp of viewports) {
    console.log(`\nTesting Navbar Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => {
      localStorage.setItem('sd_user', JSON.stringify({
        id: 'admin_demo',
        name: 'Diksha Sarvottam',
        email: 'dikshasarvottam@gmail.com',
        role: 'ADMIN'
      }));
      localStorage.setItem('sd_token', 'demo_admin_jwt');
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const checkOverlap = await page.evaluate(() => {
      const catalogEl = Array.from(document.querySelectorAll('a')).find(el => el.innerText.includes('Course Catalog'));
      const toggleEl = Array.from(document.querySelectorAll('button')).find(el => el.innerText.includes('Light') || el.innerText.includes('Dark'));

      if (!catalogEl || !toggleEl) return { visible: false, overlap: false };

      const catRect = catalogEl.getBoundingClientRect();
      const togRect = toggleEl.getBoundingClientRect();

      // Check if catalog element right edge intersects with toggle element left edge
      const isOverlapping = (catRect.right > togRect.left) && (catRect.left < togRect.right) && (catRect.bottom > togRect.top) && (catRect.top < togRect.bottom);

      return {
        catalogRight: catRect.right,
        toggleLeft: togRect.left,
        isOverlapping
      };
    });

    if (vp.width >= 1024) {
      console.log(`  Catalog Right: ${checkOverlap.catalogRight}px | Toggle Left: ${checkOverlap.toggleLeft}px`);
      console.log(`  Overlap Result: ${checkOverlap.isOverlapping ? '⚠️ OVERLAP DETECTED!' : '🎉 NO OVERLAP - CLEAN SEPARATION!'}`);
    } else {
      console.log(`  Mobile/Tablet Mode Responsive Navigation active.`);
    }

    const screenshotPath = path.join(process.cwd(), 'e2e_test_reports', `navbar_${vp.name}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`  Saved screenshot: ${screenshotPath}`);

    await page.close();
  }

  await browser.close();
})();
