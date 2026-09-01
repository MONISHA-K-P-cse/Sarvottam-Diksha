import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Populating Sarvottam Diksha with test student accounts, course purchases, quiz attempts, and doubt messages...');

  await prisma.purchase.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();

  // 1. Branding Settings
  await prisma.brandingSettings.upsert({
    where: { id: 'default' },
    update: {
      appName: 'Sarvottam Diksha',
      tagline: 'Delve in concepts with MANIKA',
      logoUrl: '/logo.png',
      primaryColor: '#0284C7',
      secondaryColor: '#EA580C',
      contactEmail: 'Dikshasarvottam@gmail.com',
      contactPhone: '+91 99646 77802',
      address: 'Sarvottam Diksha Mathematics Center, New Delhi, India',
      adminPasscode: 'Manika@Maths2026'
    },
    create: {
      id: 'default',
      appName: 'Sarvottam Diksha',
      tagline: 'Delve in concepts with MANIKA',
      logoUrl: '/logo.png',
      primaryColor: '#0284C7',
      secondaryColor: '#EA580C',
      contactEmail: 'Dikshasarvottam@gmail.com',
      contactPhone: '+91 99646 77802',
      address: 'Sarvottam Diksha Mathematics Center, New Delhi, India',
      adminPasscode: 'Manika@Maths2026'
    }
  });

  // 2. Admin User (Manika Maheshwari)
  const adminPasswordHash = await bcrypt.hash('Manika@Maths2026', 10);
  const admin1 = await prisma.user.upsert({
    where: { email: 'Dikshasarvottam@gmail.com' },
    update: { name: 'Manika Maheshwari', phone: '9964677802', passwordHash: adminPasswordHash, role: 'ADMIN' },
    create: {
      name: 'Manika Maheshwari',
      email: 'Dikshasarvottam@gmail.com',
      phone: '9964677802',
      passwordHash: adminPasswordHash,
      role: 'ADMIN'
    }
  });

  const admin2 = await prisma.user.upsert({
    where: { email: 'manika@sarvottamdiksha.com' },
    update: { name: 'Manika Maheshwari', phone: '9964677802', passwordHash: adminPasswordHash, role: 'ADMIN' },
    create: {
      name: 'Manika Maheshwari',
      email: 'manika@sarvottamdiksha.com',
      phone: '9964677802',
      passwordHash: adminPasswordHash,
      role: 'ADMIN'
    }
  });

  // 3. Test Student Accounts
  const studentPasswordHash = await bcrypt.hash('student123', 10);

  const student1 = await prisma.user.upsert({
    where: { email: 'monisha@gmail.com' },
    update: { name: 'Monisha K P', phone: '9876543211' },
    create: {
      name: 'Monisha K P',
      email: 'monisha@gmail.com',
      phone: '9876543211',
      passwordHash: studentPasswordHash,
      role: 'STUDENT'
    }
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'rahul.sharma@gmail.com' },
    update: { name: 'Rahul Sharma', phone: '9811122233' },
    create: {
      name: 'Rahul Sharma',
      email: 'rahul.sharma@gmail.com',
      phone: '9811122233',
      passwordHash: studentPasswordHash,
      role: 'STUDENT'
    }
  });

  const student3 = await prisma.user.upsert({
    where: { email: 'ananya.verma@gmail.com' },
    update: { name: 'Ananya Verma', phone: '9822233344' },
    create: {
      name: 'Ananya Verma',
      email: 'ananya.verma@gmail.com',
      phone: '9822233344',
      passwordHash: studentPasswordHash,
      role: 'STUDENT'
    }
  });

  const student4 = await prisma.user.upsert({
    where: { email: 'aditya.patel@gmail.com' },
    update: { name: 'Aditya Patel', phone: '9833344455' },
    create: {
      name: 'Aditya Patel',
      email: 'aditya.patel@gmail.com',
      phone: '9833344455',
      passwordHash: studentPasswordHash,
      role: 'STUDENT'
    }
  });

  // 4. Mathematics Courses for Grades 8, 9, 10, 11, 12
  const course10 = await prisma.course.create({
    data: {
      title: 'ABHYAAS Class 10 Mathematics Board Mastery',
      description: 'Mathematics MCQs Test Series & Chapterwise Formula Handbooks\nConducted Weekly for Class 10 Board preparation\nDuration Max 40 minutes\nMax 15 Questions',
      category: 'Class 10 Mathematics',
      price: 424,
      originalPrice: 999,
      gstAmount: 76,
      handlingFee: 14,
      platformFee: 10,
      validityDays: 365,
      likesCount: 15,
      thumbnail: '/courses/class-10.png',
      isPublished: true,
      chapters: {
        create: [
          {
            title: 'Chapter 1: Real Numbers & Polynomials',
            orderIndex: 1,
            contents: {
              create: [
                {
                  title: '1.1 Fundamental Theorem Video Lecture',
                  type: 'VIDEO',
                  url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                  duration: '25 mins',
                  isFreePreview: true,
                  orderIndex: 1
                },
                {
                  title: '1.2 Formula Handbook PDF',
                  type: 'PDF',
                  url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                  duration: '10 Pages',
                  isFreePreview: true,
                  orderIndex: 2
                }
              ]
            }
          }
        ]
      }
    }
  });

  const course11 = await prisma.course.create({
    data: {
      title: 'ABHYAAS Class 11 Mathematics (26-27)',
      description: 'Class 11 Higher Mathematics MCQs Test Series\nSets, Relations, Functions & Calculus Foundation\nDuration Max 60 minutes',
      category: 'Class 11 Mathematics',
      price: 524,
      originalPrice: 1199,
      gstAmount: 94,
      handlingFee: 14,
      platformFee: 10,
      validityDays: 365,
      likesCount: 9,
      thumbnail: '/courses/class-11.png',
      isPublished: true
    }
  });

  const course9 = await prisma.course.create({
    data: {
      title: 'ABHYAAS Class 9 Mathematics Foundation Course',
      description: 'Number Systems, Algebra & Geometry Foundation Batch for Class 9 students.',
      category: 'Class 9 Mathematics',
      price: 399,
      originalPrice: 899,
      gstAmount: 71,
      handlingFee: 14,
      platformFee: 10,
      validityDays: 365,
      likesCount: 7,
      thumbnail: '/courses/class-9.png',
      isPublished: true
    }
  });

  // 4b. PARIKSHA Mock Test Series Courses (Grades 6 - 12)
  const parikshaCourses = [
    { grade: 6, price: 299, originalPrice: 699, gst: 54, likes: 8 },
    { grade: 7, price: 349, originalPrice: 799, gst: 63, likes: 12 },
    { grade: 8, price: 399, originalPrice: 899, gst: 71, likes: 15 },
    { grade: 9, price: 449, originalPrice: 999, gst: 80, likes: 19 },
    { grade: 10, price: 499, originalPrice: 1199, gst: 90, likes: 25 },
    { grade: 11, price: 549, originalPrice: 1299, gst: 99, likes: 14 },
    { grade: 12, price: 599, originalPrice: 1499, gst: 108, likes: 32 }
  ];

  for (const c of parikshaCourses) {
    await prisma.course.create({
      data: {
        title: `PARIKSHA Class ${c.grade} Mathematics Mock Test`,
        description: `Official PARIKSHA 3-Hour Mathematics Mock Test Series for Class ${c.grade} students.\nIncludes standard board-pattern question papers, detailed step-by-step marking schemes, and time management strategies under the guidance of Manika Ma'am.`,
        category: `Class ${c.grade} Mathematics`,
        price: c.price,
        originalPrice: c.originalPrice,
        gstAmount: c.gst,
        handlingFee: 14,
        platformFee: 10,
        validityDays: 365,
        likesCount: c.likes,
        thumbnail: `/courses/class-${c.grade}.png`,
        isPublished: true
      }
    });
  }

  // 5. Test Purchases
  await prisma.purchase.createMany({
    data: [
      {
        userId: student1.id,
        courseId: course10.id,
        amount: 524,
        paymentGateway: 'RAZORPAY',
        paymentStatus: 'SUCCESS',
        orderId: 'order_test_monisha_01',
        paymentId: 'pay_test_monisha_01',
        signature: 'verified_sig_monisha'
      },
      {
        userId: student2.id,
        courseId: course11.id,
        amount: 644,
        paymentGateway: 'RAZORPAY',
        paymentStatus: 'SUCCESS',
        orderId: 'order_test_rahul_01',
        paymentId: 'pay_test_rahul_01',
        signature: 'verified_sig_rahul'
      },
      {
        userId: student3.id,
        courseId: course10.id, // Updated from course12 to course10 since Class 12 ABHYAAS is deleted
        amount: 848,
        paymentGateway: 'RAZORPAY',
        paymentStatus: 'SUCCESS',
        orderId: 'order_test_ananya_01',
        paymentId: 'pay_test_ananya_01',
        signature: 'verified_sig_ananya'
      },
      {
        userId: student4.id,
        courseId: course9.id,
        amount: 494,
        paymentGateway: 'RAZORPAY',
        paymentStatus: 'SUCCESS',
        orderId: 'order_test_aditya_01',
        paymentId: 'pay_test_aditya_01',
        signature: 'verified_sig_aditya'
      }
    ]
  });

  // 6. Test Series & Student Quiz Attempts
  const test10 = await prisma.test.create({
    data: {
      courseId: course10.id,
      title: 'ABHYAAS Class 10 Mathematics Board Model Practice Test 01',
      durationMinutes: 40,
      totalMarks: 5,
      negativeMarks: 0.25,
      passPercentage: 40.0,
      isPublished: true,
      questions: {
        create: [
          {
            questionText: 'If two positive integers a and b are written as a = x³y² and b = xy³, where x, y are prime numbers, then HCF(a, b) is:',
            optionA: 'xy',
            optionB: 'xy²',
            optionC: 'x³y³',
            optionD: 'x²y²',
            correctOption: 'B',
            explanation: 'HCF is the product of the smallest power of each common prime factor involved in the numbers. Smallest power of x is x¹, smallest power of y is y². Hence HCF = xy².',
            marks: 1.0
          },
          {
            questionText: 'If one zero of the quadratic polynomial x² + 3x + k is 2, then the value of k is:',
            optionA: '10',
            optionB: '-10',
            optionC: '-7',
            optionD: '-2',
            correctOption: 'B',
            explanation: 'Since 2 is a zero of polynomial p(x) = x² + 3x + k, p(2) = 0 => (2)² + 3(2) + k = 0 => 4 + 6 + k = 0 => k = -10.',
            marks: 1.0
          }
        ]
      }
    }
  });

  // Student Test Attempts
  const attempt1 = await prisma.testAttempt.create({
    data: {
      userId: student1.id,
      testId: test10.id,
      score: 5.0,
      maxScore: 5.0,
      correctCount: 2,
      wrongCount: 0,
      unansweredCount: 0,
      accuracyPercentage: 100.0,
      timeTakenSeconds: 765
    }
  });

  const attempt2 = await prisma.testAttempt.create({
    data: {
      userId: student3.id,
      testId: test10.id,
      score: 4.0,
      maxScore: 5.0,
      correctCount: 2,
      wrongCount: 0,
      unansweredCount: 0,
      accuracyPercentage: 90.0,
      timeTakenSeconds: 940
    }
  });

  // 7. Seed Student Doubts Conversations & Messages to Manika Maheshwari
  // Student 1 Conversation
  const conv1 = await prisma.conversation.upsert({
    where: { studentId: student1.id },
    update: {
      adminId: admin1.id,
      lastMessage: "Hello Monisha! Yes, weekly live doubt clearing sessions will be conducted every Sunday.",
      unreadCountStudent: 1
    },
    create: {
      studentId: student1.id,
      adminId: admin1.id,
      lastMessage: "Hello Monisha! Yes, weekly live doubt clearing sessions will be conducted every Sunday.",
      unreadCountStudent: 1
    }
  });

  await prisma.message.create({
    data: {
      conversationId: conv1.id,
      senderId: student1.id,
      receiverId: admin1.id,
      senderRole: 'STUDENT',
      text: "Hello Manika Ma'am, will we get live doubt solving sessions before Class 10 Board exams?",
      isRead: true
    }
  });

  await prisma.message.create({
    data: {
      conversationId: conv1.id,
      senderId: admin1.id,
      receiverId: student1.id,
      senderRole: 'ADMIN',
      text: "Hello Monisha! Yes, weekly live doubt clearing sessions will be conducted every Sunday.",
      isRead: false
    }
  });

  // Student 2 Conversation
  const conv2 = await prisma.conversation.upsert({
    where: { studentId: student2.id },
    update: {
      adminId: admin1.id,
      lastMessage: "Ma'am, please upload the formula revision PDF for Calculus Chapter 2.",
      unreadCountAdmin: 1
    },
    create: {
      studentId: student2.id,
      adminId: admin1.id,
      lastMessage: "Ma'am, please upload the formula revision PDF for Calculus Chapter 2.",
      unreadCountAdmin: 1
    }
  });

  await prisma.message.create({
    data: {
      conversationId: conv2.id,
      senderId: student2.id,
      receiverId: admin1.id,
      senderRole: 'STUDENT',
      text: "Ma'am, please upload the formula revision PDF for Calculus Chapter 2.",
      isRead: false
    }
  });

  // Student 3 Conversation
  const conv3 = await prisma.conversation.upsert({
    where: { studentId: student3.id },
    update: {
      adminId: admin1.id,
      lastMessage: "Thank you Ma'am! The ABHYAAS MCQ practice test helped me score 95% in school pre-boards.",
      unreadCountAdmin: 1
    },
    create: {
      studentId: student3.id,
      adminId: admin1.id,
      lastMessage: "Thank you Ma'am! The ABHYAAS MCQ practice test helped me score 95% in school pre-boards.",
      unreadCountAdmin: 1
    }
  });

  await prisma.message.create({
    data: {
      conversationId: conv3.id,
      senderId: student3.id,
      receiverId: admin1.id,
      senderRole: 'STUDENT',
      text: "Thank you Ma'am! The ABHYAAS MCQ practice test helped me score 95% in school pre-boards.",
      isRead: false
    }
  });

  // 8. Notifications Seed
  await prisma.notification.createMany({
    data: [
      {
        userId: null,
        title: '🎉 Course Purchased',
        message: 'Student Monisha K P purchased ABHYAAS Class 10 Mathematics (₹524).',
        type: 'PURCHASE'
      },
      {
        userId: null,
        title: '🎉 Course Purchased',
        message: 'Student Rahul Sharma purchased ABHYAAS Class 11 Mathematics (₹644).',
        type: 'PURCHASE'
      },
      {
        userId: null,
        title: '📊 Quiz Attempt Completed',
        message: 'Student Monisha K P completed ABHYAAS Class 10 Test with 100% Accuracy (Score 5/5).',
        type: 'QUIZ'
      },
      {
        userId: null,
        title: '💬 New Student Doubt Message',
        message: 'Monisha K P sent a doubt message regarding live board revision sessions.',
        type: 'DOUBT'
      }
    ]
  });

  // 9. Coupons Seed
  await prisma.coupon.deleteMany();
  await prisma.coupon.createMany({
    data: [
      { code: 'TANUSH', title: 'TANUSH Special Discount', discountType: 'FLAT', discountValue: 200, status: 'EXPIRED', usedCount: 0 },
      { code: 'FLAT200', title: 'EarlyBirdOffer', discountType: 'FLAT', discountValue: 200, status: 'EXPIRED', usedCount: 19 },
      { code: 'EARLYBIRD100', title: 'Early b Launch offer', discountType: 'FLAT', discountValue: 200, status: 'EXPIRED', usedCount: 3 },
      { code: 'WELCOME500', title: 'Welcome 500 Offer', discountType: 'FLAT', discountValue: 500, status: 'ACTIVE', usedCount: 12 }
    ]
  });

  // 10. Live Classes Seed
  await prisma.liveClass.deleteMany();
  await prisma.liveClass.create({
    data: {
      title: 'Class 10 CBSE Board Target 100/100 Live Session',
      subject: 'Mathematics',
      classGrade: 'Class 10',
      duration: '60 mins',
      status: 'UPCOMING'
    }
  });

  // 11. Free Study Resources Seed
  await prisma.freeResource.deleteMany();
  await prisma.freeResource.createMany({
    data: [
      { title: 'Class 10 Board Formula Sheet PDF', type: 'DOCUMENT', url: '/sample-formula.pdf', category: 'Formula Sheet', description: 'Complete Mathematics Formula Sheet for Class 10 CBSE' },
      { title: 'Quadratic Equations Concept Lecture', type: 'VIDEO', url: 'https://youtube.com/watch?v=sample', category: 'Video Lesson', description: 'Step by step explanation by Manika Ma\'am' },
      { title: 'Class 10 CBSE Chapterwise Test Paper', type: 'TEST', url: '/test/free-10', category: 'Free Test', description: 'Interactive MCQ practice test paper' }
    ]
  });

  // 12. Public Portals / App Banners Seed
  await prisma.publicPortal.deleteMany();
  await prisma.publicPortal.createMany({
    data: [
      { title: 'Maths Coaching Special Batch Banner', description: 'Interactive Mathematics Batch by Manika Ma\'am', buttonText: 'Explore Now', link: '/store', displayOrder: 1, status: 'PUBLISHED' },
      { title: 'ABHYAAS Quick MCQ Test Series Banner', description: 'Practice chapterwise MCQs and rank top on leaderboard', buttonText: 'Explore Now', link: '/free-test', displayOrder: 2, status: 'PUBLISHED' }
    ]
  });

  console.log('Seeded test users, course purchases, quiz attempts, coupons, live classes, free study materials, and banners cleanly!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
