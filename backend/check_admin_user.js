import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  console.log('Admins in DB:', admins);
  await prisma.$disconnect();
})();
