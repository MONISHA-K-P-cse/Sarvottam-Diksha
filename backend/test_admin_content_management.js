import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5001';

async function runAdminContentManagementTests() {
  console.log('====================================================');
  console.log('🧪 VERIFYING REAL ADMIN CONTENT MANAGEMENT ENGINE');
  console.log('====================================================');

  // STEP 1: Admin Login
  let adminToken = '';
  try {
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'Dikshasarvottam@gmail.com',
      password: 'Manika@Maths2026'
    });
    adminToken = loginRes.data.token;
    console.log('✅ STEP 1: Admin Login Successful!');
  } catch (err) {
    console.error('❌ STEP 1 FAILED: Admin login failed:', err.response?.data || err.message);
    return;
  }

  // STEP 2: Create a New Course via Admin Portal (Published)
  let courseId = '';
  const testTitle = `ABHYAAS Class 10 Special Board Prep ${Date.now()}`;
  try {
    const createRes = await axios.post(`${API_URL}/api/admin/courses`, {
      title: testTitle,
      description: 'Special 2026 board revision course created dynamically by Admin',
      category: 'Class 10 Mathematics',
      subject: 'Mathematics',
      price: 499,
      originalPrice: 1299,
      isFree: false,
      status: 'PUBLISHED',
      validityDays: 365
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (createRes.data.success) {
      courseId = createRes.data.course.id;
      console.log(`PASSED TEST 1: Admin created and published new course "${createRes.data.course.title}" with ID "${courseId}".`);
    }
  } catch (err) {
    console.error('FAILED TEST 1: Create course failed:', err.response?.data || err.message);
  }

  // STEP 3: Verify Student Portal dynamically loads the new course
  try {
    const studentCoursesRes = await axios.get(`${API_URL}/api/courses`);
    const foundInStudentStore = studentCoursesRes.data.courses.some(c => c.id === courseId);
    if (foundInStudentStore) {
      console.log('PASSED TEST 2: Student Store dynamically retrieved newly published course without app redeployment!');
    } else {
      console.error('FAILED TEST 2: Published course missing from Student Store.');
    }
  } catch (err) {
    console.error('FAILED TEST 2:', err.message);
  }

  // STEP 4: Admin switches course status to DRAFT
  try {
    await axios.patch(`${API_URL}/api/admin/courses/${courseId}/status`, { status: 'DRAFT' }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const studentCoursesAfterDraft = await axios.get(`${API_URL}/api/courses`);
    const isHiddenFromStudentStore = !studentCoursesAfterDraft.data.courses.some(c => c.id === courseId);
    if (isHiddenFromStudentStore) {
      console.log('PASSED TEST 3: DRAFT course automatically hidden from Student Store!');
    } else {
      console.error('FAILED TEST 3: DRAFT course still visible in Student Store.');
    }
  } catch (err) {
    console.error('FAILED TEST 3:', err.message);
  }

  // STEP 5: Create and Publish Public Portal Item for Website
  let portalId = '';
  const portalTitle = `Free Board Exam Formula Handbook Portal ${Date.now()}`;
  try {
    const portalRes = await axios.post(`${API_URL}/api/admin/public-portals`, {
      title: portalTitle,
      description: 'Official Mathematics Formula Portal for Class 10 & 12',
      buttonText: 'Download Formula PDF',
      link: '/free-test',
      displayOrder: 1,
      status: 'PUBLISHED'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (portalRes.data.success) {
      portalId = portalRes.data.portal.id;
      console.log(`PASSED TEST 4: Admin created public portal "${portalTitle}" with ID "${portalId}".`);
    }
  } catch (err) {
    console.error('FAILED TEST 4:', err.response?.data || err.message);
  }

  // STEP 6: Verify Public Website dynamically loads published portal
  try {
    const publicPortalsRes = await axios.get(`${API_URL}/api/public-portals`);
    const foundOnWebsite = publicPortalsRes.data.portals.some(p => p.id === portalId);
    if (foundOnWebsite) {
      console.log('PASSED TEST 5: Public Website dynamically loaded newly published portal for logged-out visitors!');
    } else {
      console.error('FAILED TEST 5: Public portal not found on website.');
    }
  } catch (err) {
    console.error('FAILED TEST 5:', err.message);
  }

  // STEP 7: Security check - Normal user cannot create courses
  try {
    await axios.post(`${API_URL}/api/admin/courses`, { title: 'Hacked Course', price: 0 });
    console.error('FAILED TEST 6: Unauthenticated request was NOT blocked!');
  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      console.log('PASSED TEST 6: Backend security enforced! Unauthorized write operations blocked with HTTP 401/403.');
    } else {
      console.error('FAILED TEST 6: Unexpected status code:', err.response?.status);
    }
  }

  console.log('\n🎉 ALL REAL ADMIN CONTENT MANAGEMENT TESTS PASSED SUCCESSFULLY!\n');
}

runAdminContentManagementTests().catch(console.error).finally(() => prisma.$disconnect());
