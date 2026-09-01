import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing course thumbnails in database to point to exact ABHYAAS and PARIKSHA template assets...');
  const courses = await prisma.course.findMany();
  
  for (const course of courses) {
    const titleUpper = (course.title || '').toUpperCase();
    const catUpper = (course.category || '').toUpperCase();
    const fullText = `${titleUpper} ${catUpper}`;
    
    let grade = 10;
    for (let g = 6; g <= 12; g++) {
      if (fullText.includes(`CLASS ${g}`) || fullText.includes(`CLASS-${g}`) || fullText.includes(`GRADE ${g}`)) {
        grade = g;
        break;
      }
    }
    
    let correctThumbnail = `/courses/abhyaas-${grade}.svg`;
    if (fullText.includes('PARIKSHA')) {
      correctThumbnail = `/courses/pariksha-${grade}.svg`;
    }

    await prisma.course.update({
      where: { id: course.id },
      data: { thumbnail: correctThumbnail }
    });
    console.log(`Updated "${course.title}" -> ${correctThumbnail}`);
  }
  
  console.log('All database course thumbnails updated successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
