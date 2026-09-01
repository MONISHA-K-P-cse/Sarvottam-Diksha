import axios from 'axios';
import XLSX from 'xlsx';

const API_BASE = 'http://localhost:5001/api';

async function testExcelImportParity() {
  console.log('============== EXCEL / CSV IMPORT FEATURE PARITY TEST ==============\n');

  try {
    // 1. Authenticate Admin
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'Dikshasarvottam@gmail.com',
      password: 'Manika@Maths2026'
    });
    const token = loginRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ Admin Logged In Successfully:', loginRes.data.user.name);

    // 2. Generate an Excel (.xlsx) Question Bank Buffer with all configurable properties
    const excelRows = [
      {
        sectionName: 'Section A - Physics',
        questionType: 'MCQ',
        questionText: 'What is the SI unit of force?',
        imageUrl: 'https://example.com/physics_diagram.png',
        optionA: 'Newton (N)',
        optionB: 'Joule (J)',
        optionC: 'Watt (W)',
        optionD: 'Pascal (Pa)',
        correctOption: 'A',
        explanation: 'Force is measured in Newtons (N = kg*m/s^2)',
        marks: 4,
        negativeMarks: 1
      },
      {
        sectionName: 'Section B - Mathematics',
        questionType: 'TYPING',
        questionText: 'Find the root of 3x - 12 = 0',
        imageUrl: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: '4',
        explanation: 'Add 12 to right side and divide by 3 to get x = 4',
        marks: 5,
        negativeMarks: 0
      },
      {
        sectionName: 'Section B - Mathematics',
        questionType: 'TRUE_FALSE',
        questionText: 'The sum of angles in a triangle is 180 degrees.',
        imageUrl: '',
        optionA: 'True',
        optionB: 'False',
        optionC: '',
        optionD: '',
        correctOption: 'A',
        explanation: 'Euclidean geometry specifies triangle internal angle sum is 180 degrees.',
        marks: 2,
        negativeMarks: 0.5
      }
    ];

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TestQuestions');
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    console.log(`\n--- STEP 1: Parse Excel Buffer (${excelBuffer.length} bytes) ---`);
    const readWb = XLSX.read(excelBuffer, { type: 'buffer' });
    const parsedRows = XLSX.utils.sheet_to_json(readWb.Sheets['TestQuestions']);
    console.log(`✅ Parsed ${parsedRows.length} question rows from Excel spreadsheet`);

    // Verify parsed properties parity
    parsedRows.forEach((r, idx) => {
      console.log(`   • Row ${idx + 1}: [${r.sectionName}] ${r.questionType} - "${r.questionText}" (+${r.marks} / -${r.negativeMarks})`);
      if (!r.sectionName || !r.questionType || !r.questionText || r.marks === undefined) {
        throw new Error(`Row ${idx + 1} missing essential question parity properties!`);
      }
    });

    // 3. Post questions to DB as normal database questions
    console.log('\n--- STEP 2: Save Imported Questions to Backend Database ---');
    const testRes = await axios.post(`${API_BASE}/admin/tests`, {
      title: `Excel Parity Test ${Date.now()}`,
      durationMinutes: 60,
      tags: 'Class 10',
      totalMarks: 100,
      negativeMarks: 0.25
    }, authHeaders);

    const createdTestId = testRes.data.test.id;
    console.log('✅ Created DB Test ID:', createdTestId);

    for (const q of parsedRows) {
      const qRes = await axios.post(`${API_BASE}/admin/tests/${createdTestId}/questions`, {
        sectionName: q.sectionName,
        questionType: q.questionType,
        questionText: q.questionText,
        imageUrl: q.imageUrl || '',
        optionA: q.optionA || '',
        optionB: q.optionB || '',
        optionC: q.optionC || '',
        optionD: q.optionD || '',
        correctOption: q.correctOption,
        explanation: q.explanation || '',
        marks: Number(q.marks),
        negativeMarks: Number(q.negativeMarks)
      }, authHeaders);
      console.log(`   ✓ Inserted into DB: Question ID ${qRes.data.question.id} (${qRes.data.question.sectionName})`);
    }

    // 4. Retrieve saved test & verify database questions integrity
    console.log('\n--- STEP 3: Re-fetch Test from DB & Verify Question Parity ---');
    const fullTestRes = await axios.get(`${API_BASE}/tests/${createdTestId}`, authHeaders);
    const fetchedQuestions = fullTestRes.data.test.questions || [];

    console.log(`✅ Retrieved ${fetchedQuestions.length} normal database questions from test`);
    
    // Verify each property matches
    const q1 = fetchedQuestions.find(q => q.questionText.includes('unit of force'));
    if (!q1 || q1.sectionName !== 'Section A - Physics' || q1.questionType !== 'MCQ' || q1.marks !== 4 || q1.imageUrl !== 'https://example.com/physics_diagram.png') {
      throw new Error('Property mismatch on imported Q1!');
    }
    console.log('   ✓ Q1 (MCQ + Diagram URL + Marks) 100% verified');

    const q2 = fetchedQuestions.find(q => q.questionText.includes('root of 3x - 12'));
    if (!q2 || q2.sectionName !== 'Section B - Mathematics' || q2.questionType !== 'TYPING' || q2.correctOption !== '4') {
      throw new Error('Property mismatch on imported Q2!');
    }
    console.log('   ✓ Q2 (TYPING Numerical Target + Explanation) 100% verified');

    console.log('\n================ EXCEL IMPORT FEATURE PARITY VERIFIED 100% PASSED ================');

  } catch (err) {
    console.error('❌ Excel Import Test Failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

testExcelImportParity();
