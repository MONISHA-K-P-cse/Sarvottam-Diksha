import fs from 'fs';
import path from 'path';

const outputDir = path.resolve('../frontend/public/courses');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function createSvg({ seriesTitle, subtitleText, headerColor, classNum }) {
  const classText = `Class ${classNum}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#0369A1"/>
    </linearGradient>
    <linearGradient id="boardGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="woodGrad" x1="0" y1="0" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C2D12"/>
      <stop offset="100%" stop-color="#451A03"/>
    </linearGradient>
  </defs>

  <rect width="800" height="500" fill="url(#wallGrad)"/>
  <rect x="0" y="0" width="800" height="42" fill="#FFFFFF"/>
  <text x="30" y="27" font-family="system-ui, sans-serif" font-size="14" font-weight="900" fill="#0284C7" letter-spacing="1">SARVOTTAM DIKSHA</text>
  
  <rect x="340" y="6" width="120" height="30" rx="8" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
  <text x="400" y="26" font-family="system-ui, sans-serif" font-size="15" font-weight="900" fill="#0F172A" text-anchor="middle">${classText}</text>

  <rect x="180" y="55" width="440" height="270" rx="12" fill="url(#woodGrad)" stroke="#270F04" stroke-width="4"/>
  <rect x="194" y="69" width="412" height="242" rx="6" fill="url(#boardGrad)"/>

  <text x="400" y="105" font-family="system-ui, sans-serif" font-size="28" font-weight="900" fill="${headerColor}" text-anchor="middle" letter-spacing="2">${seriesTitle}</text>
  <text x="400" y="125" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#E2E8F0" text-anchor="middle" letter-spacing="1">${subtitleText}</text>

  <line x1="230" y1="135" x2="570" y2="135" stroke="#475569" stroke-width="1.5" stroke-dasharray="4,4"/>

  <text x="230" y="160" font-family="system-ui, sans-serif" font-size="14" font-weight="900" fill="#FDBA74">Help For</text>
  <text x="240" y="185" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#FFFFFF">• Quick Revision</text>
  <text x="240" y="207" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#FFFFFF">• Time Management</text>
  <text x="240" y="229" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#FFFFFF">• Assess Knowledge</text>
  <text x="240" y="251" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#FFFFFF">• Build Attempt Strategy</text>

  <text x="445" y="170" font-family="Georgia, serif" font-size="12" font-style="italic" fill="#93C5FD">M = ( (x₁+x₂)/2, (y₁+y₂)/2 )</text>
  <text x="445" y="200" font-family="Georgia, serif" font-size="13" font-style="italic" fill="#FCA5A5">y = mx + c</text>
  <text x="445" y="230" font-family="Georgia, serif" font-size="12" font-style="italic" fill="#86EFAC">sin²θ + cos²θ = 1</text>
  <text x="445" y="260" font-family="Georgia, serif" font-size="12" font-style="italic" fill="#FDE047">x = (-b ± √(b²-4ac)) / 2a</text>

  <g transform="translate(130, 125)">
    <circle cx="50" cy="35" r="22" fill="#FDBA74"/>
    <path d="M 30,35 Q 50,15 70,35" fill="#7C2D12"/>
    <path d="M 25,65 L 75,65 L 85,165 L 15,165 Z" fill="#EA580C"/>
    <line x1="60" y1="70" x2="115" y2="40" stroke="#FDBA74" stroke-width="8" stroke-linecap="round"/>
  </g>

  <rect x="180" y="325" width="440" height="20" fill="#9A3412"/>
  
  <circle cx="230" cy="300" r="24" fill="#0EA5E9" stroke="#0284C7" stroke-width="3"/>
  <path d="M 215,300 Q 230,280 245,300" fill="none" stroke="#22C55E" stroke-width="2"/>
  
  <rect x="330" y="300" width="70" height="12" rx="2" fill="#EF4444"/>
  <rect x="325" y="312" width="75" height="13" rx="2" fill="#3B82F6"/>
  <rect x="320" y="325" width="80" height="12" rx="2" fill="#10B981"/>

  <rect x="500" y="310" width="60" height="15" rx="3" fill="#F59E0B"/>
  <line x1="570" y1="305" x2="590" y2="320" stroke="#DC2626" stroke-width="4" stroke-linecap="round"/>
</svg>`;
}

for (let g = 6; g <= 12; g++) {
  // ABHYAAS
  const abhyaasSvg = createSvg({
    seriesTitle: 'ABHYAAS',
    subtitleText: '(WEEKLY BOARD TEST SERIES & FORMULA HANDBOOK)',
    headerColor: '#FF6500',
    classNum: g
  });
  fs.writeFileSync(path.join(outputDir, `abhyaas-${g}.svg`), abhyaasSvg);

  // PARIKSHA
  const parikshaSvg = createSvg({
    seriesTitle: 'PARIKSHA',
    subtitleText: '(3 HR. MATHS MOCK TEST)',
    headerColor: '#F59E0B',
    classNum: g
  });
  fs.writeFileSync(path.join(outputDir, `pariksha-${g}.svg`), parikshaSvg);
}

console.log('Successfully generated ABHYAAS and PARIKSHA SVG thumbnail templates for Classes 6-12!');
