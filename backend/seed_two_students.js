import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!adminUser) {
    console.error('Admin user not found!');
    return;
  }

  const passwordHash = await bcrypt.hash('student123', 10);

  // Student 1: Aarav Sharma
  const student1 = await prisma.user.upsert({
    where: { email: 'aarav.sharma@gmail.com' },
    update: { name: 'Aarav Sharma', passwordHash, role: 'STUDENT' },
    create: {
      name: 'Aarav Sharma',
      email: 'aarav.sharma@gmail.com',
      phone: '9876501234',
      passwordHash,
      role: 'STUDENT'
    }
  });

  // Student 2: Priya Patel
  const student2 = await prisma.user.upsert({
    where: { email: 'priya.patel@gmail.com' },
    update: { name: 'Priya Patel', passwordHash, role: 'STUDENT' },
    create: {
      name: 'Priya Patel',
      email: 'priya.patel@gmail.com',
      phone: '9812345678',
      passwordHash,
      role: 'STUDENT'
    }
  });

  console.log('Created test student accounts:', student1.name, student2.name);

  // Conversation 1 (Aarav Sharma)
  const text1 = 'Ma\'am, in Class 10 Quadratic Equations, how do we determine whether roots are real or imaginary using the discriminant (D = b² - 4ac)?';
  const conv1 = await prisma.conversation.upsert({
    where: { studentId: student1.id },
    update: { adminId: adminUser.id, lastMessage: text1, unreadCountAdmin: 1 },
    create: { studentId: student1.id, adminId: adminUser.id, lastMessage: text1, unreadCountAdmin: 1 }
  });

  await prisma.message.create({
    data: {
      conversationId: conv1.id,
      senderId: student1.id,
      receiverId: adminUser.id,
      senderRole: 'STUDENT',
      text: text1,
      isRead: false
    }
  });

  await prisma.notification.create({
    data: {
      userId: null,
      title: `💬 New Doubt from ${student1.name}`,
      message: `"${text1.substring(0, 70)}..."`,
      type: 'DOUBT'
    }
  });

  // Conversation 2 (Priya Patel)
  const text2 = 'Manika Ma\'am, please explain the shortcut to solve Trigonometric Identities without memorizing all formulas for Class 10 Board Exam.';
  const conv2 = await prisma.conversation.upsert({
    where: { studentId: student2.id },
    update: { adminId: adminUser.id, lastMessage: text2, unreadCountAdmin: 1 },
    create: { studentId: student2.id, adminId: adminUser.id, lastMessage: text2, unreadCountAdmin: 1 }
  });

  await prisma.message.create({
    data: {
      conversationId: conv2.id,
      senderId: student2.id,
      receiverId: adminUser.id,
      senderRole: 'STUDENT',
      text: text2,
      isRead: false
    }
  });

  await prisma.notification.create({
    data: {
      userId: null,
      title: `💬 New Doubt from ${student2.name}`,
      message: `"${text2.substring(0, 70)}..."`,
      type: 'DOUBT'
    }
  });

  console.log('Sent doubt messages and initialized real-time conversations successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
