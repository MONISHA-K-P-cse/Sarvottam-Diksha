import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  // Wait for image to load
  await page.waitForSelector('img[alt*="Manika"]');

  const artifactPath = path.join(
    '/Users/monisha/.gemini/antigravity-ide/brain/ecfe658c-6772-4ba9-8b78-ac1de48d58fa',
    'hero_crop_preview.png'
  );

  await page.screenshot({ path: artifactPath, fullPage: false });
  console.log('Saved screenshot to:', artifactPath);

  await browser.close();
})();
