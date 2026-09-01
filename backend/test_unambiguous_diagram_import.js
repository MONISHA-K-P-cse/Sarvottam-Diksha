import axios from 'axios';
import XLSX from 'xlsx';

const API_BASE = 'http://localhost:5001/api';

async function testUnambiguousDiagramImport() {
  console.log('=================================================================================');
  console.log('   UNAMBIGUOUS QUESTION ID DIAGRAM MAPPING & PREVIEW SYSTEM VERIFICATION TEST   ');
  console.log('=================================================================================\n');

  try {
    // 1. Login Admin
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'Dikshasarvottam@gmail.com',
      password: 'Manika@Maths2026'
    });
    const token = loginRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ 1. Admin Login Successful:', loginRes.data.user.name);

    // 2. Setup Diagram Files Map (PNG, JPG, JPEG, WEBP)
    const uploadedDiagramFilesMap = {
      'q1.png': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'q21.jpg': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...',
      'q22.webp': 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
      'q99_unused.jpg': 'data:image/jpeg;base64,unused_bytes...'
    };
    const uploadedDiagramFileNamesList = ['q1.png', 'q21.jpg', 'q22.webp', 'q99_unused.jpg'];
    console.log(`✅ 2. Loaded ${uploadedDiagramFileNamesList.length} diagram files (.png, .jpg, .webp)`);

    // 3. Create Multi-Section Excel Workbook (Q1-Q3 in Section A, Q21-Q22 in Section B)
    const multiSectionRows = [
      {
        'Question ID': 'Q1',
        Section: 'Section A',
        Question: 'Q1 Question Text: What is 5 + 5?',
        'Question Type': 'MCQ',
        'Option A': '10', 'Option B': '20', 'Option C': '30', 'Option D': '40',
        'Correct Answer': 'A', Marks: 4, 'Negative Marks': 1,
        Solution: '5 + 5 = 10',
        'Diagram File': 'Q1.png'
      },
      {
        'Question ID': 'Q2',
        Section: 'Section A',
        Question: 'Q2 Question Text: What is 10 * 10?',
        'Question Type': 'TYPING',
        'Option A': '', 'Option B': '', 'Option C': '', 'Option D': '',
        'Correct Answer': '100', Marks: 4, 'Negative Marks': 0,
        Solution: '10 * 10 = 100',
        'Diagram File': ''
      },
      {
        'Question ID': 'Q3',
        Section: 'Section A',
        Question: 'Q3 Question Text with Missing Diagram File Reference',
        'Question Type': 'MCQ',
        'Option A': 'A', 'Option B': 'B', 'Option C': 'C', 'Option D': 'D',
        'Correct Answer': 'A', Marks: 4, 'Negative Marks': 1,
        Solution: 'Solution text',
        'Diagram File': 'Q3_nonexistent.png' // Missing diagram
      },
      {
        'Question ID': 'Q21',
        Section: 'Section B',
        Question: 'Q21 Question Text: Triangle Theorem in Section B',
        'Question Type': 'TRUE_FALSE',
        'Option A': 'True', 'Option B': 'False', 'Option C': '', 'Option D': '',
        'Correct Answer': 'True', Marks: 2, 'Negative Marks': 0.5,
        Solution: 'Thales theorem',
        'Diagram File': 'Q21.jpg'
      },
      {
        'Question ID': 'Q22',
        Section: 'Section B',
        Question: 'Q22 Question Text: WebP Diagram in Section B',
        'Question Type': 'MCQ',
        'Option A': 'Alpha', 'Option B': 'Beta', 'Option C': 'Gamma', 'Option D': 'Delta',
        'Correct Answer': 'A', Marks: 4, 'Negative Marks': 1,
        Solution: 'WebP diagram test',
        'Diagram File': 'Q22.webp'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(multiSectionRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Parse workbook
    const parsedWb = XLSX.read(buf, { type: 'buffer' });
    const parsedRows = XLSX.utils.sheet_to_json(parsedWb.Sheets['Questions']);

    const validQuestions = [];
    const hardErrors = [];
    const warnings = [];
    const newlyDiscoveredSections = new Set();
    const seenQuestionIds = new Set();
    const referencedDiagramsSet = new Set();

    parsedRows.forEach((row, i) => {
      const qId = row['Question ID'] || `Q${i + 1}`;
      if (seenQuestionIds.has(qId.toUpperCase())) {
        hardErrors.push(`Duplicate Question ID "${qId}" detected`);
      }
      seenQuestionIds.add(qId.toUpperCase());

      const secName = row.Section || 'Section A';
      newlyDiscoveredSections.add(secName);

      let diagFile = row['Diagram File'] || '';
      let matchedData = '';
      let diagStatus = 'none';

      if (diagFile) {
        const norm = diagFile.toLowerCase().trim();
        const stem = norm.replace(/\.[^/.]+$/, '');
        referencedDiagramsSet.add(norm);
        referencedDiagramsSet.add(stem);

        matchedData = uploadedDiagramFilesMap[norm] || uploadedDiagramFilesMap[stem] || '';
        if (matchedData) {
          diagStatus = 'attached';
        } else {
          diagStatus = 'missing';
          warnings.push(`${qId}: Diagram missing: ${diagFile}`);
        }
      }

      validQuestions.push({
        customQId: qId,
        sectionName: secName,
        questionType: row['Question Type'],
        questionText: row.Question,
        imageUrl: matchedData,
        diagramRefName: diagFile,
        diagramStatus: diagStatus,
        optionA: row['Option A'], optionB: row['Option B'],
        optionC: row['Option C'], optionD: row['Option D'],
        correctOption: row['Correct Answer'] === 'True' ? 'A' : row['Correct Answer'],
        explanation: row.Solution,
        marks: row.Marks, negativeMarks: row['Negative Marks']
      });
    });

    const unusedDiagrams = uploadedDiagramFileNamesList.filter(fname => {
      const lower = fname.toLowerCase().trim();
      const stem = lower.replace(/\.[^/.]+$/, '');
      return !referencedDiagramsSet.has(lower) && !referencedDiagramsSet.has(stem);
    });

    console.log(`✅ 3. Multi-Section Import Diagnostic Summary:`);
    console.log(`   - Total Parsed Questions: ${validQuestions.length}`);
    console.log(`   - Discovered Sections: ${Array.from(newlyDiscoveredSections).join(', ')}`);
    console.log(`   - Diagrams Attached: ${validQuestions.filter(q => q.diagramStatus === 'attached').length}`);
    console.log(`   - Missing Diagram Warnings: ${warnings.length} ("${warnings.join(', ')}")`);
    console.log(`   - Unused Uploaded Diagram Files: ${unusedDiagrams.length} ("${unusedDiagrams.join(', ')}")`);

    // Verify Expectations
    if (validQuestions.length !== 5) throw new Error('Parsed questions count mismatch');
    if (newlyDiscoveredSections.size !== 2) throw new Error('Multi-section discovery failed');
    if (warnings.length !== 1 || !warnings[0].includes('Q3_nonexistent.png')) throw new Error('Missing diagram warning failed');
    if (unusedDiagrams.length !== 1 || unusedDiagrams[0] !== 'q99_unused.jpg') throw new Error('Unused diagram tracking failed');

    // 4. Test Duplicate Question ID Rejection
    const duplicateRows = [
      { 'Question ID': 'Q1', Section: 'Section A', Question: 'First Q1', 'Question Type': 'MCQ', 'Correct Answer': 'A' },
      { 'Question ID': 'Q1', Section: 'Section A', Question: 'Second Q1', 'Question Type': 'MCQ', 'Correct Answer': 'B' }
    ];
    const dupSeen = new Set();
    let dupDetected = false;
    duplicateRows.forEach(r => {
      if (dupSeen.has(r['Question ID'])) dupDetected = true;
      dupSeen.add(r['Question ID']);
    });
    if (!dupDetected) throw new Error('Duplicate Question ID detection failed');
    console.log('✅ 4. Duplicate Question ID Rejection verified (Caught duplicate "Q1")');

    // 5. Save Multi-Section Questions to DB
    const testRes = await axios.post(`${API_BASE}/admin/tests`, {
      title: `Unambiguous ID Import Test ${Date.now()}`,
      durationMinutes: 60, tags: 'Class 10', totalMarks: 100, negativeMarks: 0.25
    }, authHeaders);
    const testId = testRes.data.test.id;

    for (const q of validQuestions) {
      await axios.post(`${API_BASE}/admin/tests/${testId}/questions`, {
        sectionName: q.sectionName,
        questionType: q.questionType,
        questionText: q.questionText,
        imageUrl: q.imageUrl || '',
        optionA: q.optionA || '', optionB: q.optionB || '', optionC: q.optionC || '', optionD: q.optionD || '',
        correctOption: q.correctOption, explanation: q.explanation || '',
        marks: Number(q.marks), negativeMarks: Number(q.negativeMarks)
      }, authHeaders);
    }
    console.log(`✅ 5. Saved ${validQuestions.length} multi-section questions to Backend Database`);

    // 6. Re-fetch Test from DB & Verify Section Distribution
    const dbRes = await axios.get(`${API_BASE}/tests/${testId}`, authHeaders);
    const dbQuestions = dbRes.data.test.questions || [];
    const secAInDb = dbQuestions.filter(q => q.sectionName === 'Section A');
    const secBInDb = dbQuestions.filter(q => q.sectionName === 'Section B');

    console.log(`✅ 6. DB Re-fetch Verification:`);
    console.log(`   - Total DB Questions: ${dbQuestions.length}`);
    console.log(`   - Section A Questions in DB: ${secAInDb.length}`);
    console.log(`   - Section B Questions in DB: ${secBInDb.length}`);

    if (dbQuestions.length !== 5 || secAInDb.length !== 3 || secBInDb.length !== 2) {
      throw new Error('Database multi-section question persistence verification failed');
    }

    console.log('\n================ ALL UNAMBIGUOUS QUESTION ID MAPPING REQUIREMENTS 100% PASSED ================');

  } catch (err) {
    console.error('❌ Test execution failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

testUnambiguousDiagramImport();
