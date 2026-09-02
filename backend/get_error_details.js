import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));
  page.on('console', msg => console.log('CONSOLE:', msg.text()));

  await page.goto('https://sarvottam-diksha.web.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const errorDetails = await page.evaluate(() => {
    const details = document.querySelector('details');
    return details ? details.innerText : 'No details element';
  });

  console.log('ERROR DETAILS TEXT:', errorDetails);
  await browser.close();
})();
