import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('https://sarvottam-diksha.web.app/');
  await page.waitForTimeout(2000);

  const result = await page.evaluate(async () => {
    try {
      const { auth, sendPasswordResetEmail } = await import('/src/firebase/config.js');
      console.log('Calling sendPasswordResetEmail for pmonisha0629@gmail.com...');
      await sendPasswordResetEmail(auth, 'pmonisha0629@gmail.com');
      return { success: true };
    } catch (err) {
      return { success: false, code: err.code, message: err.message };
    }
  });

  console.log('Direct Evaluation Result:', result);
  await browser.close();
})();
