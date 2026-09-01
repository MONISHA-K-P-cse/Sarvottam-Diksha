import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'student_test_123',
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      role: 'STUDENT'
    }));
    window.localStorage.setItem('sd_token', 'demo_student_token');
  });

  console.log('1. Navigating to Doubts Inbox on Live App (https://sarvottam-diksha.web.app/chats)...');
  await page.goto('https://sarvottam-diksha.web.app/chats', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const initialBodyText = await page.evaluate(() => document.body.innerText);
  console.log('   Page Title Visible:', initialBodyText.includes('Doubts') || initialBodyText.includes('Chats') || initialBodyText.includes('Inbox'));

  console.log('2. Sending doubt message: "Ma\'am please explain Quadratic Formula D = b² - 4ac"...');
  const chatInput = page.locator('input[type="text"]').last();
  await chatInput.fill("Ma'am please explain Quadratic Formula D = b² - 4ac");
  
  const sendBtn = page.locator('button[type="submit"]').last();
  await sendBtn.click();

  await page.waitForTimeout(2500);

  const afterSendBodyText = await page.evaluate(() => document.body.innerText);
  const sentOk = afterSendBodyText.includes("Quadratic Formula D = b² - 4ac");
  const replyOk = afterSendBodyText.includes("I have received your doubt");

  console.log('\n=================== DOUBT CHAT E2E VERIFICATION REPORT ===================');
  console.log('Student Message Delivered:', sentOk ? 'PASS ✓' : 'FAIL ✗');
  console.log('Faculty Auto-Reply Received:', replyOk ? 'PASS ✓' : 'FAIL ✗');
  console.log('=========================================================================\n');

  const artifactDir = '/Users/monisha/.gemini/antigravity-ide/brain/96160f44-8e21-49b8-9cea-f7f9be2c34b0';
  const screenshotPath = path.join(artifactDir, 'screenshot_doubt_chat_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();
})();
