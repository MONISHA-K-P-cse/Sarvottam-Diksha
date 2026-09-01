import { Jimp } from 'jimp';
import path from 'path';

async function cropCollage() {
  const imagePath = '/Users/monisha/.gemini/antigravity-ide/brain/ecfe658c-6772-4ba9-8b78-ac1de48d58fa/media__1787831999565.jpg';
  const destDir = path.resolve('public/courses');

  console.log(`Loading image from ${imagePath}...`);
  const image = await Jimp.read(imagePath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  console.log(`Image dimensions: ${width}x${height}`);

  const colWidth = Math.floor(width / 3);
  const rowHeight = Math.floor(height / 2);

  const grid = [
    { row: 0, col: 0, name: '10' }, // Class 10
    { row: 0, col: 1, name: '8' },  // Class 8
    { row: 0, col: 2, name: '9' },  // Class 9
    { row: 1, col: 0, name: '11' }, // Class 11
    { row: 1, col: 1, name: '12' }, // Class 12
    { row: 1, col: 2, name: '7' },  // Class 7
  ];

  for (const item of grid) {
    const x = item.col * colWidth;
    const y = item.row * rowHeight;

    const cropped = image.clone().crop({ x, y, w: colWidth, h: rowHeight });

    const classPath = path.join(destDir, `class-${item.name}.png`);
    const abhyaasPath = path.join(destDir, `abhyaas-${item.name}.png`);

    await cropped.write(classPath);
    await cropped.write(abhyaasPath);
    console.log(`Saved Class ${item.name} thumbnail -> ${classPath}`);
  }

  // Also clone Class 7 for Class 6 or create Class 6 variant
  const class6 = image.clone().crop({ x: 0, y: 0, w: colWidth, h: rowHeight });
  await class6.write(path.join(destDir, `class-6.png`));
  await class6.write(path.join(destDir, `abhyaas-6.png`));
  console.log(`Saved Class 6 thumbnail.`);

  console.log('Successfully cropped all 6 official class template images!');
}

cropCollage().catch(console.error);
