import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Setting up demo state for Course "XYZ" and Quiz "hi"...');
  await page.goto('https://sarvottam-diksha.web.app/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const courseId = 'course_xyz_demo';
  const quizId = 'quiz_hi_demo';

  await page.evaluate(({ courseId, quizId }) => {
    // Admin / Student session
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'student_demo',
      name: 'Rohan Sharma',
      email: 'rohan.student@gmail.com',
      role: 'STUDENT'
    }));
    window.localStorage.setItem('sd_token', 'demo_student_token');

    // Create course XYZ
    const courseXYZ = {
      id: courseId,
      title: 'XYZ Mathematics Complete Masterclass',
      category: 'Class 10',
      price: 1499,
      originalPrice: 2999,
      description: 'Comprehensive course with attached practice quizzes',
      attachedQuizzes: [
        {
          id: quizId,
          title: 'hi - Chapter 1 MCQ Practice Quiz',
          durationMinutes: 30,
          totalMarks: 40,
          questions: [
            { id: 'q1', questionText: 'What is 5 + 5?', options: ['10', '20', '30', '40'], correctIndex: 0, positiveMarks: 4 }
          ]
        }
      ]
    };
    const storedCourses = JSON.parse(localStorage.getItem('sd_custom_courses') || '[]');
    localStorage.setItem('sd_custom_courses', JSON.stringify([courseXYZ, ...storedCourses.filter(c => c.id !== courseId)]));

    // Create quiz hi
    const quizHi = {
      id: quizId,
      title: 'hi - Chapter 1 MCQ Practice Quiz',
      courseId: courseId,
      courseIds: [courseId],
      assignedCourseIds: [courseId],
      durationMinutes: 30,
      totalMarks: 40,
      questionsCount: 1,
      questions: [
        { id: 'q1', questionText: 'What is 5 + 5?', options: ['10', '20', '30', '40'], correctIndex: 0, positiveMarks: 4 }
      ]
    };
    const storedTests = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
    localStorage.setItem('sd_custom_tests', JSON.stringify([quizHi, ...storedTests.filter(t => t.id !== quizId)]));
    localStorage.setItem(`sd_course_quizzes_${courseId}`, JSON.stringify([quizHi]));
  }, { courseId, quizId });

  console.log('2. Visiting Course XYZ Preview Page as Student...');
  await page.goto(`https://sarvottam-diksha.web.app/course/${courseId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const previewContent = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== VERIFICATION: COURSE XYZ PREVIEW ===================');
  console.log('Course Title Visible:', previewContent.includes('XYZ Mathematics Complete Masterclass'));
  console.log('Quiz "hi" Title Visible:', previewContent.includes('hi - Chapter 1 MCQ Practice Quiz'));
  console.log('Included Quizzes Section Header Visible:', previewContent.includes('Included MCQ Practice Tests & Quizzes') || previewContent.includes('Official Included Test Series'));
  console.log('========================================================================\n');

  console.log('3. Enrolling student and attempting Quiz "hi"...');
  await page.evaluate((courseId) => {
    localStorage.setItem('sd_enrolled_courses', JSON.stringify([courseId]));
  }, courseId);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const attemptBtn = page.locator('button:has-text("Attempt Quiz Now"), button:has-text("Start Quiz")').first();
  const isAttemptBtnVisible = await attemptBtn.isVisible();
  console.log('Attempt Quiz Button Visible for Enrolled Student:', isAttemptBtnVisible);

  if (isAttemptBtnVisible) {
    await attemptBtn.click();
    await page.waitForTimeout(2000);
    const testEngineText = await page.evaluate(() => document.body.innerText);
    console.log('Navigated to Test Engine & Can Attempt Quiz:', testEngineText.includes('What is 5 + 5?') || testEngineText.includes('hi'));
  }

  await browser.close();
})();
