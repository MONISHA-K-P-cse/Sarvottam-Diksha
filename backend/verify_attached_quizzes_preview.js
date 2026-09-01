import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('1. Loading page to establish domain...');
  await page.goto('https://sarvottam-diksha.web.app/admin/courses/c1/preview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('2. Injecting custom test created under Test Portal assigned to course c1...');
  await page.evaluate(() => {
    window.localStorage.setItem('sd_user', JSON.stringify({
      id: 'admin_demo',
      name: 'Diksha Sarvottam',
      email: 'dikshasarvottam@gmail.com',
      role: 'ADMIN'
    }));
    window.localStorage.setItem('sd_token', 'demo_admin_token');

    const demoCourse = {
      id: 'c1',
      title: 'Class 10 Mathematics Complete NCERT Coaching',
      price: 650,
      category: 'CLASS 10 MATHEMATICS',
      status: 'PUBLISHED',
      description: 'Complete NCERT concept videos and tests',
      chapters: []
    };
    localStorage.setItem('sd_courses', JSON.stringify([demoCourse]));

    const demoQuiz = {
      id: 'quiz_portal_c1_01',
      title: 'Polynomials Timed Board MCQ Practice Test 01',
      durationMinutes: 45,
      totalMarks: 60,
      questionCount: 20,
      assignedCourseIds: ['c1'],
      courseId: 'c1',
      accessMode: 'PAID',
      questions: [
        { id: 'q1', text: 'Secret Question 1' },
        { id: 'q2', text: 'Secret Question 2' }
      ]
    };
    localStorage.setItem('sd_custom_tests', JSON.stringify([demoQuiz]));
  });

  console.log('3. Re-navigating to /admin/courses/c1/preview...');
  await page.goto('https://sarvottam-diksha.web.app/admin/courses/c1/preview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const fullText = await page.evaluate(() => document.body.innerText);

  console.log('\n=================== VERIFICATION: ATTACHED QUIZZES PREVIEW ===================');
  console.log('Quiz Title Visible:', fullText.includes('Polynomials Timed Board MCQ Practice Test 01'));
  console.log('Questions Count Badge Visible:', fullText.includes('2 Questions') || fullText.includes('20 Questions'));
  console.log('Duration Badge Visible:', fullText.includes('45 Mins'));
  console.log('Total Marks Badge Visible:', fullText.includes('60 Marks'));
  console.log('Questions Text Hidden from Preview:', !fullText.includes('Secret Question 1'));
  console.log('================================================================================\n');

  await browser.close();
})();
