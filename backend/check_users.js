import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Manika@Maths2026', 10);

  await prisma.user.upsert({
    where: { email: 'dikshasarvottam@gmail.com' },
    update: { passwordHash: hash, role: 'ADMIN', name: 'Manika Maheshwari' },
    create: { name: 'Manika Maheshwari', email: 'dikshasarvottam@gmail.com', phone: '9964677802', passwordHash: hash, role: 'ADMIN' }
  });

  await prisma.user.upsert({
    where: { email: 'manika@sarvottamdiksha.com' },
    update: { passwordHash: hash, role: 'ADMIN', name: 'Manika Maheshwari' },
    create: { name: 'Manika Maheshwari', email: 'manika@sarvottamdiksha.com', phone: '9964677802', passwordHash: hash, role: 'ADMIN' }
  });

  const users = await prisma.user.findMany();
  console.log('--- ALL USERS IN DB ---');
  users.forEach(u => {
    console.log(`Email: "${u.email}", Name: "${u.name}", Role: "${u.role}"`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
