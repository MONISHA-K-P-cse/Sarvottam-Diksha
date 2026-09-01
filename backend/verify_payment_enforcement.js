import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Setting up Paid & Free Courses...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const paidId = 'paid_course_demo_99';
  const freeId = 'free_course_demo_99';

  await page.evaluate(({ paidId, freeId }) => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'student_777',
      name: 'Rohan Student',
      email: 'rohan@gmail.com',
      role: 'STUDENT'
    }));
    window.localStorage.setItem('sd_token', 'demo_student_token');
    window.localStorage.setItem('sd_enrolled_courses', JSON.stringify([]));

    const paidCourse = {
      id: paidId,
      title: 'Paid Physics Olympiad Batch',
      price: 1499,
      attachedQuizzes: [{ id: 'q_paid', title: 'Physics Quiz 1', durationMinutes: 30, questions: [{ id: 'q1', questionText: 'Force unit?', options: ['Newton', 'Joule'], correctIndex: 0 }] }]
    };

    const freeCourse = {
      id: freeId,
      title: 'Free Science Foundation Course',
      price: 0,
      isFree: true,
      attachedQuizzes: [{ id: 'q_free', title: 'Free Starter Quiz', durationMinutes: 15, questions: [{ id: 'q1', questionText: 'Water formula?', options: ['H2O', 'CO2'], correctIndex: 0 }] }]
    };

    localStorage.setItem('sd_custom_courses', JSON.stringify([paidCourse, freeCourse]));
  }, { paidId, freeId });

  console.log('2. Testing Paid Course before payment...');
  await page.goto(`https://sarvottam-diksha.web.app/course/${paidId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  let paidText = await page.evaluate(() => document.body.innerText);
  console.log('\n=================== VERIFICATION: PAID COURSE ===================');
  console.log('Contains "Buy Now":', paidText.includes('Buy Now'));
  console.log('Contains "🔒 Locked":', paidText.includes('Locked'));
  console.log('Contains "Attempt Quiz Now" (Before Payment):', paidText.includes('Attempt Quiz Now'));
  console.log('=================================================================\n');

  console.log('3. Testing Free Course before unlocking...');
  await page.goto(`https://sarvottam-diksha.web.app/course/${freeId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  let freeText = await page.evaluate(() => document.body.innerText);
  console.log('\n=================== VERIFICATION: FREE COURSE ===================');
  console.log('Contains "Unlock Free Course":', freeText.includes('Unlock Free Course'));

  console.log('Clicking "Unlock Free Course" button...');
  await page.locator('button:has-text("Unlock Free Course")').click();
  await page.waitForTimeout(1500);

  let unlockedFreeText = await page.evaluate(() => document.body.innerText);
  console.log('Contains "Course Unlocked" after clicking:', unlockedFreeText.includes('Course Unlocked'));
  console.log('Contains "Attempt Quiz Now" for free course:', unlockedFreeText.includes('Attempt Quiz Now'));
  console.log('=================================================================\n');

  await browser.close();
})();
