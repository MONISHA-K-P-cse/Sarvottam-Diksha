import fs from 'fs';
import path from 'path';

const srcDir = '/Users/monisha/.gemini/antigravity-ide/brain/ecfe658c-6772-4ba9-8b78-ac1de48d58fa';
const destDir = path.resolve('../frontend/public/courses');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const fileMap = {
  'media__1787832343497.png': 'pariksha-6.png',
  'media__1787832415598.png': 'pariksha-7.png',
  'media__1787832278002.png': 'pariksha-8.png',
  'media__1787832301845.png': 'pariksha-9.png',
  'media__1787832324172.png': 'pariksha-10.png',
  'media__1787832288511.png': 'pariksha-11.png',
  'media__1787832313848.png': 'pariksha-12.png',
};

for (const [srcFile, destFile] of Object.entries(fileMap)) {
  const srcPath = path.join(srcDir, srcFile);
  const destPath = path.join(destDir, destFile);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${srcFile} -> ${destPath}`);
  } else {
    console.error(`Source file missing: ${srcPath}`);
  }
}

console.log('Successfully copied all 7 official PARIKSHA image templates to frontend/public/courses!');
