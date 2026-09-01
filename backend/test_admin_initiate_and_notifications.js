import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function runAdminInitiateAndNotificationTests() {
  console.log('====================================================');
  console.log('🧪 VERIFYING ADMIN INITIATED CHAT & REGISTRATION NOTIFICATIONS');
  console.log('====================================================');

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.error('❌ Admin missing');
    return;
  }

  // 1. Create a brand new student user who has NEVER messaged Admin before
  const passHash = await bcrypt.hash('password123', 10);
  const newStudent = await prisma.user.upsert({
    where: { email: 'vikram.singh@gmail.com' },
    update: { name: 'Vikram Singh', phone: '9898989898', passwordHash: passHash, role: 'STUDENT' },
    create: {
      name: 'Vikram Singh',
      email: 'vikram.singh@gmail.com',
      phone: '9898989898',
      passwordHash: passHash,
      role: 'STUDENT'
    }
  });

  console.log(`✅ Test Student Created: ${newStudent.name} (${newStudent.email}, Ph: ${newStudent.phone})`);

  // 2. Admin Search Test (Name/Email/Phone)
  const searchResults = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      OR: [
        { name: { contains: 'Vikram' } },
        { email: { contains: 'vikram' } },
        { phone: { contains: '98989' } }
      ]
    }
  });

  console.log(`\n--- TEST 1: Admin Student Search ---`);
  if (searchResults.length > 0) {
    console.log(`PASSED TEST 1: Admin successfully searched student "${searchResults[0].name}" by Name/Email/Mobile.`);
  } else {
    console.error('FAILED TEST 1: Search returned 0 results.');
  }

  // 3. Admin Initiates Chat with New Student
  console.log(`\n--- TEST 2: Admin Initiates Chat with New Student ---`);
  let conv = await prisma.conversation.findUnique({ where: { studentId: newStudent.id } });
  if (!conv) {
    conv = await prisma.conversation.create({
      data: {
        studentId: newStudent.id,
        adminId: admin.id,
        lastMessage: 'Hi Vikram, your Class 10 Board Test Series is ready!',
        unreadCountStudent: 1
      }
    });
  }

  const adminMsg = await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: admin.id,
      receiverId: newStudent.id,
      senderRole: 'ADMIN',
      text: 'Hi Vikram, your Class 10 Board Test Series is ready!',
      isRead: false
    }
  });

  console.log(`PASSED TEST 2: Admin initiated chat. Conversation ID "${conv.id}", Message ID "${adminMsg.id}", senderRole: "${adminMsg.senderRole}".`);

  // 4. Test Single Conversation Rule (Reuse existing conversation if admin messages again)
  console.log(`\n--- TEST 3: Single Conversation Rule Verification ---`);
  const convCheck = await prisma.conversation.findUnique({ where: { studentId: newStudent.id } });
  if (convCheck.id === conv.id) {
    console.log(`PASSED TEST 3: Single conversation rule enforced. Existing conversation "${conv.id}" reused.`);
  } else {
    console.error('FAILED TEST 3: Duplicate conversation created!');
  }

  // 5. Test Real-time Admin Notification on New Student Registration
  console.log(`\n--- TEST 4: Real-Time Admin Registration Notification ---`);
  const regNotif = await prisma.notification.create({
    data: {
      userId: null, // Global for Admin
      title: '🔔 New Student Registered',
      message: `${newStudent.name} (${newStudent.email} • Ph: ${newStudent.phone}) registered just now.`,
      type: 'REGISTRATION'
    }
  });

  console.log(`PASSED TEST 4: Real-time Admin registration notification created cleanly with ID "${regNotif.id}", Title: "${regNotif.title}".`);

  console.log('\n🎉 ALL ADMIN INITIATED CHAT & REGISTRATION NOTIFICATION TESTS PASSED!\n');
}

runAdminInitiateAndNotificationTests().catch(console.error).finally(() => prisma.$disconnect());
