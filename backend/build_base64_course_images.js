import fs from 'fs';
import path from 'path';

const srcDir = '/Users/monisha/.gemini/antigravity-ide/brain/ecfe658c-6772-4ba9-8b78-ac1de48d58fa';
const coursesDir = path.resolve('../frontend/public/courses');
const outputFile = path.resolve('../frontend/src/utils/officialCourseImages.js');

const parikshaFiles = {
  6: 'media__1787832343497.png',
  7: 'media__1787832415598.png',
  8: 'media__1787832278002.png',
  9: 'media__1787832301845.png',
  10: 'media__1787832324172.png',
  11: 'media__1787832288511.png',
  12: 'media__1787832313848.png'
};

const abhyaasFiles = {
  6: 'class-6.png',
  7: 'class-7.png',
  8: 'class-8.png',
  9: 'class-9.png',
  10: 'class-10.png',
  11: 'class-11.png',
  12: 'class-12.png'
};

const parikshaData = {};
const abhyaasData = {};

for (const [grade, filename] of Object.entries(parikshaFiles)) {
  const fullPath = path.join(srcDir, filename);
  if (fs.existsSync(fullPath)) {
    const base64 = fs.readFileSync(fullPath).toString('base64');
    parikshaData[grade] = `data:image/png;base64,${base64}`;
    console.log(`Loaded PARIKSHA Class ${grade} (${base64.length} chars)`);
  } else {
    console.error(`Missing PARIKSHA file: ${fullPath}`);
  }
}

for (const [grade, filename] of Object.entries(abhyaasFiles)) {
  const fullPath = path.join(coursesDir, filename);
  if (fs.existsSync(fullPath)) {
    const base64 = fs.readFileSync(fullPath).toString('base64');
    abhyaasData[grade] = `data:image/png;base64,${base64}`;
    console.log(`Loaded ABHYAAS Class ${grade} (${base64.length} chars)`);
  } else {
    console.error(`Missing ABHYAAS file: ${fullPath}`);
  }
}

const fileContent = `// Official Exact Uploaded Course Images (Embedded Base64)

export const OFFICIAL_PARIKSHA_IMAGES = ${JSON.stringify(parikshaData, null, 2)};

export const OFFICIAL_ABHYAAS_IMAGES = ${JSON.stringify(abhyaasData, null, 2)};
`;

fs.writeFileSync(outputFile, fileContent);
console.log(`Successfully written official course images to ${outputFile}`);
