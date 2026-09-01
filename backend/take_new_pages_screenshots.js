import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const artifactDir = '/Users/monisha/.gemini/antigravity-ide/brain/96160f44-8e21-49b8-9cea-f7f9be2c34b0';

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.addInitScript(() => {
    const userCourses = [
      {
        id: 'abcd',
        title: 'abcd',
        description: 'Complete NCERT & RS Aggarwal Mathematics Coaching with step-by-step video solutions, formula notes and test series.',
        category: 'Class 10 Mathematics',
        subject: 'Mathematics',
        price: 1000,
        originalPrice: 1500,
        validityDays: 365,
        status: 'PUBLISHED',
        thumbnail: '/assets/poster-banner.png',
        chapters: [
          {
            id: 'ch-1',
            title: 'Chapter 1: Real Numbers & Proofs',
            videos: [{ id: 'v-1', title: 'Lecture 1: Fundamental Theorem of Arithmetic', duration: '30 Mins' }],
            pdfs: [{ id: 'p-1', title: 'Real Numbers NCERT Notes PDF' }]
          }
        ]
      }
    ];
    window.localStorage.setItem('sd_custom_courses', JSON.stringify(userCourses));
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_jwt');
  });

  console.log('1. Navigating to dedicated Course Manage Page (/admin/course-manage/abcd)...');
  await page.goto('https://sarvottam-diksha.web.app/admin/course-manage/abcd', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Screenshot 1: NEW Dedicated Course Management Workspace Page
  const ss1Path = path.join(artifactDir, 'screenshot_new_dedicated_manage_page.png');
  await page.screenshot({ path: ss1Path, fullPage: true });
  console.log(`Saved screenshot 1 (Manage Page): ${ss1Path}`);

  console.log('2. Navigating to dedicated Student Course Preview Page (/courses/abcd)...');
  await page.goto('https://sarvottam-diksha.web.app/courses/abcd', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Screenshot 2: NEW Dedicated Student Course Preview Page
  const ss2Path = path.join(artifactDir, 'screenshot_new_dedicated_preview_page.png');
  await page.screenshot({ path: ss2Path, fullPage: true });
  console.log(`Saved screenshot 2 (Preview Page): ${ss2Path}`);

  await browser.close();
  console.log('ALL NEW PAGE SCREENSHOTS TAKEN SUCCESSFULLY!');
})();
