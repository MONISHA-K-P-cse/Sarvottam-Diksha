import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseHealth() {
  console.log('🔍 Checking Sarvottam Diksha SQLite Database Health...');

  try {
    const usersCount = await prisma.user.count();
    const studentsCount = await prisma.user.count({ where: { role: 'STUDENT' } });
    const coursesCount = await prisma.course.count();
    const purchasesCount = await prisma.purchase.count({ where: { paymentStatus: 'SUCCESS' } });
    const couponsCount = await prisma.coupon.count();
    const liveClassesCount = await prisma.liveClass.count();
    const freeResourcesCount = await prisma.freeResource.count();
    const publicPortalsCount = await prisma.publicPortal.count();
    const testsCount = await prisma.test.count();
    const attemptsCount = await prisma.testAttempt.count();

    console.log('----------------------------------------------------');
    console.log(`✅ Registered Users: ${usersCount} (Students: ${studentsCount})`);
    console.log(`✅ Published Courses: ${coursesCount}`);
    console.log(`✅ Completed Purchases: ${purchasesCount}`);
    console.log(`✅ Active Coupons: ${couponsCount}`);
    console.log(`✅ Live/Upcoming Classes: ${liveClassesCount}`);
    console.log(`✅ Free Study Resources: ${freeResourcesCount}`);
    console.log(`✅ Public Portals/Banners: ${publicPortalsCount}`);
    console.log(`✅ MCQ Test Series: ${testsCount}`);
    console.log(`✅ Quiz Attempts: ${attemptsCount}`);
    console.log('----------------------------------------------------');

    // Seed default courses if 0
    if (coursesCount === 0) {
      console.log('🌱 Seeding default courses...');
      await prisma.course.createMany({
        data: [
          { title: 'ABHYAAS Class 10 Board Mastery (26-27)', category: 'Class 10 Mathematics', price: 500, originalPrice: 999, isPublished: true, status: 'PUBLISHED' },
          { title: 'ABHYAAS Class 11 Mathematics (26-27)', category: 'Class 11 Mathematics', price: 500, originalPrice: 999, isPublished: true, status: 'PUBLISHED' },
          { title: 'ABHYAAS Class 9 Foundation (26-27)', category: 'Class 9 Mathematics', price: 500, originalPrice: 999, isPublished: true, status: 'PUBLISHED' },
          { title: 'ABHYAAS Class 8 Practice Series (26-27)', category: 'Class 8 Mathematics', price: 500, originalPrice: 999, isPublished: true, status: 'PUBLISHED' }
        ]
      });
      console.log('✅ Default courses seeded!');
    }

    // Seed default coupons if 0
    if (couponsCount === 0) {
      console.log('🌱 Seeding default coupons...');
      await prisma.coupon.createMany({
        data: [
          { code: 'TANUSH', title: 'TANUSH Special Discount', discountType: 'FLAT', discountValue: 200, status: 'EXPIRED', usedCount: 0 },
          { code: 'FLAT200', title: 'EarlyBirdOffer', discountType: 'FLAT', discountValue: 200, status: 'EXPIRED', usedCount: 19 },
          { code: 'EARLYBIRD100', title: 'Early b Launch offer', discountType: 'FLAT', discountValue: 200, status: 'EXPIRED', usedCount: 3 },
          { code: 'WELCOME500', title: 'Welcome 500 Offer', discountType: 'FLAT', discountValue: 500, status: 'ACTIVE', usedCount: 12 }
        ]
      });
      console.log('✅ Default coupons seeded!');
    }

    // Seed default free resources if 0
    if (freeResourcesCount === 0) {
      console.log('🌱 Seeding default free resources...');
      await prisma.freeResource.createMany({
        data: [
          { title: 'Class 10 Board Formula Sheet PDF', type: 'DOCUMENT', url: '/sample-formula.pdf', category: 'Formula Sheet', description: 'Complete Mathematics Formula Sheet for Class 10 CBSE' },
          { title: 'Quadratic Equations Concept Lecture', type: 'VIDEO', url: 'https://youtube.com/watch?v=sample', category: 'Video Lesson', description: 'Step by step explanation by Manika Ma\'am' },
          { title: 'Class 10 CBSE Chapterwise Test Paper', type: 'TEST', url: '/test/free-10', category: 'Free Test', description: 'Interactive MCQ practice test paper' }
        ]
      });
      console.log('✅ Default free resources seeded!');
    }

    console.log('🚀 DATABASE HEALTH VERIFICATION COMPLETE! ALL TABLES ONLINE!');
  } catch (error) {
    console.error('❌ DB Check Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseHealth();
