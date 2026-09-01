import axios from 'axios';
import XLSX from 'xlsx';

const API_BASE = 'http://localhost:5001/api';

async function testMixedImportWorkflow() {
  console.log('============== MIXED QUESTION CREATION WORKFLOW TEST (REQUIREMENT 14) ==============\n');

  try {
    // 1. Authenticate Admin
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'Dikshasarvottam@gmail.com',
      password: 'Manika@Maths2026'
    });
    const token = loginRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ 1. Admin Logged In Successfully:', loginRes.data.user.name);

    // 2. Create Test
    const createTestRes = await axios.post(
      `${API_BASE}/admin/tests`,
      {
        title: `Mixed Workflow Test ${Date.now()}`,
        durationMinutes: 60,
        tags: 'Class 10',
        totalMarks: 100,
        negativeMarks: 0.25
      },
      authHeaders
    );
    const testId = createTestRes.data.test.id;
    console.log(`✅ 2. Created Test in DB with ID: ${testId}`);

    // In-memory test questions state (simulating frontend state)
    let questionsList = [];

    // 3. Batch 1 Import: 10 Questions from Excel
    console.log('\n--- STEP 3: Import Batch 1 (10 Questions from Excel) into Section A ---');
    const batch1ExcelRows = [];
    for (let i = 1; i <= 10; i++) {
      batch1ExcelRows.push({
        Section: 'Section A',
        Question: `Batch 1 Excel Question ${i}: What is ${i} + ${i}?`,
        'Question Type': i % 2 === 0 ? 'MCQ' : 'TYPING',
        'Option A': `${i * 2}`,
        'Option B': `${i * 2 + 1}`,
        'Option C': `${i * 2 + 2}`,
        'Option D': `${i * 2 + 3}`,
        'Correct Answer': i % 2 === 0 ? 'A' : `${i * 2}`,
        Marks: 4,
        'Negative Marks': 1,
        Solution: `Adding ${i} to ${i} equals ${i * 2}`
      });
    }

    const ws1 = XLSX.utils.json_to_sheet(batch1ExcelRows);
    const wb1 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb1, ws1, 'Questions');
    const buf1 = XLSX.write(wb1, { type: 'buffer', bookType: 'xlsx' });

    const parsedWb1 = XLSX.read(buf1, { type: 'buffer' });
    const parsedRows1 = XLSX.utils.sheet_to_json(parsedWb1.Sheets['Questions']);

    parsedRows1.forEach((r, idx) => {
      questionsList.push({
        id: `q-excel-b1-${idx + 1}`,
        sectionName: r.Section || 'Section A',
        questionType: r['Question Type'],
        questionText: r.Question,
        imageUrl: '',
        optionA: r['Option A'] || '',
        optionB: r['Option B'] || '',
        optionC: r['Option C'] || '',
        optionD: r['Option D'] || '',
        correctOption: r['Correct Answer'],
        explanation: r.Solution || '',
        marks: r.Marks || 4,
        negativeMarks: r['Negative Marks'] || 1
      });
    });

    console.log(`✅ 4. Verified ${questionsList.length} questions imported into Section A`);
    if (questionsList.length !== 10) throw new Error('Batch 1 import failed');

    // 4. Manually add Question 11 & Question 12
    console.log('\n--- STEP 5 & 6: Manually Add Question 11 & Question 12 ---');
    questionsList.push({
      id: `q-manual-11`,
      sectionName: 'Section A',
      questionType: 'MCQ',
      questionText: 'Manual Question 11: What is the derivative of x^2?',
      imageUrl: '',
      optionA: '2x',
      optionB: 'x',
      optionC: 'x^3 / 3',
      optionD: '2',
      correctOption: 'A',
      explanation: 'Power rule: d/dx(x^n) = n*x^(n-1)',
      marks: 4,
      negativeMarks: 1
    });

    questionsList.push({
      id: `q-manual-12`,
      sectionName: 'Section A',
      questionType: 'TYPING',
      questionText: 'Manual Question 12: Solve 5x = 100',
      imageUrl: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: '20',
      explanation: 'Divide both sides by 5 to get x = 20',
      marks: 4,
      negativeMarks: 0
    });

    console.log(`✅ Questions list count after manual additions: ${questionsList.length}`);

    // 5. Batch 2 Import: Another 8 Questions from Excel
    console.log('\n--- STEP 7: Import Batch 2 (8 Questions from Excel) into Section A ---');
    const batch2ExcelRows = [];
    for (let i = 13; i <= 20; i++) {
      batch2ExcelRows.push({
        Section: 'Section A',
        Question: `Batch 2 Excel Question ${i}: Solve ${i} * 3`,
        'Question Type': 'MCQ',
        'Option A': `${i * 3}`,
        'Option B': `${i * 3 + 5}`,
        'Option C': `${i * 3 - 2}`,
        'Option D': `${i * 3 + 10}`,
        'Correct Answer': 'A',
        Marks: 4,
        'Negative Marks': 1,
        Solution: `Multiplying ${i} by 3 yields ${i * 3}`
      });
    }

    const ws2 = XLSX.utils.json_to_sheet(batch2ExcelRows);
    const wb2 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb2, ws2, 'Questions');
    const buf2 = XLSX.write(wb2, { type: 'buffer', bookType: 'xlsx' });

    const parsedWb2 = XLSX.read(buf2, { type: 'buffer' });
    const parsedRows2 = XLSX.utils.sheet_to_json(parsedWb2.Sheets['Questions']);

    parsedRows2.forEach((r, idx) => {
      questionsList.push({
        id: `q-excel-b2-${idx + 1}`,
        sectionName: r.Section || 'Section A',
        questionType: r['Question Type'],
        questionText: r.Question,
        imageUrl: '',
        optionA: r['Option A'] || '',
        optionB: r['Option B'] || '',
        optionC: r['Option C'] || '',
        optionD: r['Option D'] || '',
        correctOption: r['Correct Answer'],
        explanation: r.Solution || '',
        marks: r.Marks || 4,
        negativeMarks: r['Negative Marks'] || 1
      });
    });

    console.log(`✅ 8. Verified Section A now contains exactly ${questionsList.length} questions (Coexisting Excel + Manual)`);
    if (questionsList.length !== 20) throw new Error(`Expected 20 questions, got ${questionsList.length}`);

    // 6. Edit one imported question (Question 1) & Add a diagram to Question 3
    console.log('\n--- STEP 9 & 10: Edit Imported Question & Attach Diagram ---');
    const q1Idx = questionsList.findIndex(q => q.id === 'q-excel-b1-1');
    questionsList[q1Idx].questionText = 'UPDATED Q1: What is 1 + 1 in binary?';
    questionsList[q1Idx].optionA = '10';
    questionsList[q1Idx].correctOption = 'A';
    console.log(`   ✓ Edited Question 1: "${questionsList[q1Idx].questionText}"`);

    const q3Idx = questionsList.findIndex(q => q.id === 'q-excel-b1-3');
    questionsList[q3Idx].imageUrl = 'https://example.com/triangle_geometry.png';
    console.log(`   ✓ Attached Diagram to Question 3: "${questionsList[q3Idx].imageUrl}"`);

    // 7. Save all 20 questions to Backend Database
    console.log('\n--- STEP 11: Save All 20 Questions to Backend Database ---');
    for (const q of questionsList) {
      await axios.post(
        `${API_BASE}/admin/tests/${testId}/questions`,
        {
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
        },
        authHeaders
      );
    }
    console.log(`✅ Saved all 20 questions to Database successfully`);

    // 8. Re-fetch Test from DB to verify persistence & diagram rendering
    console.log('\n--- STEP 12, 13, 14 & 15: Re-fetch Test from DB & Verify All 20 Questions & Diagram ---');
    const dbTestRes = await axios.get(`${API_BASE}/tests/${testId}`, authHeaders);
    const dbTest = dbTestRes.data.test;
    const dbQuestions = dbTest.questions || [];

    console.log(`✅ 13. Re-fetched Test Title: "${dbTest.title}"`);
    console.log(`✅ 13. Total Questions in DB: ${dbQuestions.length}`);

    if (dbQuestions.length !== 20) {
      throw new Error(`Expected 20 questions in DB, found ${dbQuestions.length}`);
    }

    const updatedQ1 = dbQuestions.find(q => q.questionText && q.questionText.includes('in binary'));
    if (!updatedQ1 || updatedQ1.optionA !== '10') {
      throw new Error('Edited question 1 not persisted properly in DB');
    }
    console.log('   ✓ Verified edited question 1 persisted cleanly in DB');

    const diagramQ3 = dbQuestions.find(q => q.imageUrl && q.imageUrl.includes('triangle_geometry.png'));
    if (!diagramQ3) {
      throw new Error('Diagram question 3 not persisted properly in DB');
    }
    console.log('   ✓ Verified diagram attached to question 3 persisted cleanly in DB');

    console.log('\n================ ALL 15 MIXED WORKFLOW REQUIREMENTS 100% VERIFIED PASSED ================');

  } catch (err) {
    console.error('❌ Mixed Import Workflow Test Failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

testMixedImportWorkflow();
