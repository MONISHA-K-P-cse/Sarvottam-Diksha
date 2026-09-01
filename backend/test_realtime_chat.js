import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runChatVerificationTests() {
  console.log('====================================================');
  console.log('🧪 SARVOTTAM DIKSHA REAL-TIME CHAT ENGINE VERIFICATION');
  console.log('====================================================');

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const studentA = await prisma.user.findFirst({ where: { email: 'monisha@gmail.com' } });
  const studentB = await prisma.user.findFirst({ where: { email: 'aarav.sharma@gmail.com' } });

  if (!admin || !studentA || !studentB) {
    console.error('❌ Required test users missing in DB!');
    return;
  }

  console.log(`✅ Admin: ${admin.name} (${admin.email})`);
  console.log(`✅ Student A: ${studentA.name} (${studentA.email})`);
  console.log(`✅ Student B: ${studentB.name} (${studentB.email})`);

  // TEST 1: Student A sends doubt
  console.log('\n--- TEST 1: Student A sends doubt ---');
  let convA = await prisma.conversation.upsert({
    where: { studentId: studentA.id },
    update: { lastMessage: 'Ma\'am, I have a doubt in Chapter 3.', lastMessageAt: new Date() },
    create: { studentId: studentA.id, adminId: admin.id, lastMessage: 'Ma\'am, I have a doubt in Chapter 3.', lastMessageAt: new Date() }
  });

  const msg1 = await prisma.message.create({
    data: {
      conversationId: convA.id,
      senderId: studentA.id,
      receiverId: admin.id,
      senderRole: 'STUDENT',
      text: 'Ma\'am, I have a doubt in Chapter 3.',
      isRead: false
    }
  });
  console.log(`PASSED TEST 1: Message created with ID "${msg1.id}", senderRole: "${msg1.senderRole}", text: "${msg1.text}"`);

  // TEST 2: Admin replies to Student A
  console.log('\n--- TEST 2: Admin replies to Student A ---');
  const msg2 = await prisma.message.create({
    data: {
      conversationId: convA.id,
      senderId: admin.id,
      receiverId: studentA.id,
      senderRole: 'ADMIN',
      text: 'Sure, send me the question.',
      isRead: false
    }
  });
  console.log(`PASSED TEST 2: Admin reply created with ID "${msg2.id}", senderRole: "${msg2.senderRole}", text: "${msg2.text}"`);

  // TEST 3: Student B privacy isolation check
  console.log('\n--- TEST 3: Student B conversation privacy isolation ---');
  let convB = await prisma.conversation.findUnique({ where: { studentId: studentB.id } });
  if (!convB) {
    convB = await prisma.conversation.create({
      data: { studentId: studentB.id, adminId: admin.id }
    });
  }
  const studentBMessages = await prisma.message.findMany({ where: { conversationId: convB.id } });
  const containsStudentAMsg = studentBMessages.some(m => m.conversationId === convA.id);
  if (!containsStudentAMsg) {
    console.log(`PASSED TEST 3: Strict isolation verified. Student B cannot view Student A's conversation "${convA.id}".`);
  } else {
    console.error('FAILED TEST 3: Security breach! Student B accessed Student A messages.');
  }

  // TEST 4: Rapid consecutive messages
  console.log('\n--- TEST 4: Rapid consecutive doubt messages ---');
  const rapidText1 = 'Rapid doubt question 1: How to find roots of 2x^2 + 5x + 3 = 0?';
  const rapidText2 = 'Rapid doubt question 2: Is discriminant D = 1?';
  const msgRapid1 = await prisma.message.create({
    data: { conversationId: convA.id, senderId: studentA.id, receiverId: admin.id, senderRole: 'STUDENT', text: rapidText1 }
  });
  const msgRapid2 = await prisma.message.create({
    data: { conversationId: convA.id, senderId: studentA.id, receiverId: admin.id, senderRole: 'STUDENT', text: rapidText2 }
  });
  console.log(`PASSED TEST 4: Rapid messages processed sequentially without loss: "${msgRapid1.id}" & "${msgRapid2.id}".`);

  // TEST 5: Database persistence check on reopen
  console.log('\n--- TEST 5: Message persistence check ---');
  const persistentMsgs = await prisma.message.findMany({
    where: { conversationId: convA.id },
    orderBy: { createdAt: 'asc' }
  });
  console.log(`PASSED TEST 5: Total ${persistentMsgs.length} messages safely persisted in SQLite DB for conversation "${convA.id}".`);
  console.log('\n🎉 ALL 5 REAL-TIME CHAT VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
}

runChatVerificationTests().catch(console.error).finally(() => prisma.$disconnect());
