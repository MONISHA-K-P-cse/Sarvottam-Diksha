import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const allCourses = await prisma.course.findMany();
  console.log(`Total courses in DB: ${allCourses.length}`);
  const statusCounts = {};
  allCourses.forEach(c => {
    const key = `status:${c.status} | isPublished:${c.isPublished}`;
    statusCounts[key] = (statusCounts[key] || 0) + 1;
  });
  console.log('Course Status Counts:', statusCounts);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
