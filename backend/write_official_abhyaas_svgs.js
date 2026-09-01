import fs from 'fs';
import path from 'path';

const destDir = path.resolve('../frontend/public/courses');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const themeColors = {
  6: { primary: '#6366F1', text: '#6366F1', gradEnd: '#4F46E5', sky: '#818CF8' },
  7: { primary: '#FC830E', text: '#FC830E', gradEnd: '#EA580C', sky: '#F97316' },
  8: { primary: '#77B41C', text: '#77B41C', gradEnd: '#65A30D', sky: '#84CC16' },
  9: { primary: '#FFBE00', text: '#D97706', gradEnd: '#F59E0B', sky: '#FBBF24' },
  10: { primary: '#0284C7', text: '#0284C7', gradEnd: '#0369A1', sky: '#38BDF8' },
  11: { primary: '#7F5BC9', text: '#7F5BC9', gradEnd: '#6D28D9', sky: '#A78BFA' },
  12: { primary: '#FD6FA1', text: '#DB2777', gradEnd: '#E11D48', sky: '#F472B6' }
};

function generateAbhyaasCardSvg(classNum) {
  const t = themeColors[classNum] || themeColors[10];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad_${classNum}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${t.primary}"/>
      <stop offset="100%" stop-color="${t.gradEnd}"/>
    </linearGradient>
  </defs>

  <!-- Background Canvas -->
  <rect width="800" height="500" rx="16" fill="url(#bgGrad_${classNum})"/>

  <!-- Geometric City Skyscrapers Background Silhouette -->
  <path d="M 0,320 L 40,320 L 40,500 L 0,500 Z" fill="${t.gradEnd}" opacity="0.4"/>
  <path d="M 40,280 L 100,280 L 100,500 L 40,500 Z" fill="${t.primary}" opacity="0.5"/>
  <path d="M 700,260 L 760,260 L 760,500 L 700,500 Z" fill="#EA580C" opacity="0.8"/>
  <path d="M 740,300 L 800,300 L 800,500 L 740,500 Z" fill="#C2410C" opacity="0.9"/>

  <!-- Puffy White Clouds Top Left -->
  <path d="M -20,60 C -20,10 40,-10 90,20 C 130,-20 210,0 220,50 C 260,50 280,100 240,140 C 200,170 100,170 50,150 C -10,150 -20,100 -20,60 Z" fill="#FFFFFF"/>
  <path d="M 600,-20 C 640,-20 680,10 710,10 C 750,-10 820,20 810,70 C 820,120 750,140 700,120 C 650,140 590,100 600,60 C 580,20 600,-20 600,-20 Z" fill="#FFFFFF" opacity="0.9"/>

  <!-- Top-Left Branding Logo Area -->
  <text x="35" y="65" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#0F172A" letter-spacing="1">SARVOTTAM</text>
  <text x="35" y="85" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#EA580C" letter-spacing="1">DIKSHA</text>
  <text x="35" y="105" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="700" fill="${t.text}">Delve in concepts with MANIKA</text>
  <path d="M 165,55 L 180,40 L 195,55 L 180,85 Z" fill="#EA580C"/>
  <path d="M 180,40 L 195,55 L 185,55 Z" fill="#F97316"/>

  <!-- Class Badge Pill (Class ${classNum}) -->
  <rect x="330" y="35" width="140" height="42" rx="14" fill="#FFFFFF" stroke="${t.primary}" stroke-width="2.5"/>
  <text x="400" y="62" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" fill="${t.text}" text-anchor="middle">Class ${classNum}</text>

  <!-- ABHYAAS Title & Subtitle -->
  <text x="400" y="140" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">ABHYAAS</text>
  <text x="400" y="175" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#0F172A" text-anchor="middle" letter-spacing="1">Quick MCQ test</text>

  <!-- Speech Bubble: Regular Practice (Left) -->
  <rect x="130" y="225" width="135" height="36" rx="10" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
  <text x="197" y="248" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="900" fill="#0F172A" text-anchor="middle">Regular Practice</text>

  <!-- Speech Bubble: Concept Building (Right) -->
  <rect x="535" y="260" width="145" height="36" rx="10" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
  <text x="607" y="283" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="900" fill="#0F172A" text-anchor="middle">Concept Building</text>

  <!-- Blackboard & Educator Character Center -->
  <g transform="translate(250, 210)">
    <!-- Blackboard Frame behind teacher -->
    <rect x="35" y="45" width="230" height="130" rx="8" fill="#15803D" stroke="#166534" stroke-width="4"/>
    
    <!-- Desk Base -->
    <path d="M 20,175 L 280,175 L 270,220 L 30,220 Z" fill="#EAB308"/>

    <!-- Pencil Holder with Pencils (Left of Desk) -->
    <rect x="60" y="130" width="30" height="45" rx="6" fill="#FFFFFF" stroke="#15803D" stroke-width="2"/>
    <line x1="68" y1="105" x2="68" y2="130" stroke="#EF4444" stroke-width="5" stroke-linecap="round"/>
    <line x1="75" y1="95" x2="75" y2="130" stroke="#3B82F6" stroke-width="5" stroke-linecap="round"/>
    <line x1="82" y1="100" x2="82" y2="130" stroke="#EAB308" stroke-width="5" stroke-linecap="round"/>

    <!-- Teacher Body -->
    <path d="M 125,120 L 175,120 L 185,210 L 115,210 Z" fill="#FFFFFF"/>
    <path d="M 146,120 L 154,120 L 152,170 L 148,170 Z" fill="#78350F"/>
    <circle cx="150" cy="90" r="22" fill="#FDE68A"/>
    <path d="M 132,85 C 132,65 168,65 168,85 C 160,70 140,70 132,85 Z" fill="#0F172A"/>

    <!-- Raised Index Finger Hand (Right Hand) -->
    <line x1="125" y1="135" x2="105" y2="95" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>
    <circle cx="105" cy="90" r="6" fill="#FDE68A"/>

    <!-- Holding Book Arm (Left Hand) -->
    <rect x="170" y="135" width="22" height="30" rx="3" fill="#F59E0B"/>
  </g>

  <!-- Floating Green/Red Books in Corner -->
  <g transform="translate(680, 50)">
    <rect x="0" y="0" width="40" height="28" rx="4" fill="#22C55E" transform="rotate(15)"/>
    <rect x="10" y="50" width="40" height="28" rx="4" fill="#EAB308" transform="rotate(-10)"/>
  </g>

  <!-- Bottom Puffy Clouds Frame -->
  <path d="M -20,440 C 50,400 150,400 220,440 C 290,480 390,440 480,460 C 570,480 670,420 820,450 L 820,520 L -20,520 Z" fill="#FFFFFF" opacity="0.95"/>
</svg>`;
}

for (let g = 6; g <= 12; g++) {
  const svgContent = generateAbhyaasCardSvg(g);
  fs.writeFileSync(path.join(destDir, `abhyaas-${g}.svg`), svgContent);
  fs.writeFileSync(path.join(destDir, `class-${g}.svg`), svgContent);
}

console.log('Successfully wrote official ABHYAAS Class 6-12 SVG assets to public/courses!');
