import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import MathRenderer from '../components/math/MathRenderer';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Sparkles,
  ArrowLeft,
  Lock
} from 'lucide-react';

export const getOptionText = (q, optKey) => {
  if (!q) return optKey === 'A' ? 'True' : optKey === 'B' ? 'False' : `Option ${optKey}`;

  const isTF = String(q.questionType || q.type || '').toUpperCase() === 'TRUE_FALSE';
  if (isTF) {
    if (optKey === 'A') return (q.optionA || q.option_a || 'True');
    if (optKey === 'B') return (q.optionB || q.option_b || 'False');
  }

  // 1. Standard keys (optionA, optionB, optionC, optionD)
  const keyUpper = `option${optKey}`;
  if (q[keyUpper] !== undefined && q[keyUpper] !== null && String(q[keyUpper]).trim() !== '') {
    return String(q[keyUpper]);
  }

  // 2. Snake case keys (option_a, option_b, option_c, option_d)
  const keyLower = `option_${optKey.toLowerCase()}`;
  if (q[keyLower] !== undefined && q[keyLower] !== null && String(q[keyLower]).trim() !== '') {
    return String(q[keyLower]);
  }

  // 3. Alternative naming keys
  const altKeys = [`choice${optKey}`, `choice_${optKey.toLowerCase()}`, `Option ${optKey}`, `choice_${optKey}`];
  for (const k of altKeys) {
    if (q[k] !== undefined && q[k] !== null && String(q[k]).trim() !== '') {
      return String(q[k]);
    }
  }

  // 4. Array options indexing
  if (Array.isArray(q.options)) {
    const idxMap = { A: 0, B: 1, C: 2, D: 3 };
    const idx = idxMap[optKey];
    if (idx !== undefined && q.options[idx] !== undefined && String(q.options[idx]).trim() !== '') {
      return String(q.options[idx]);
    }
  }

  return `Option ${optKey}`;
};

export const isTypedOrNumericalQuestion = (q) => {
  if (!q) return false;
  const t = String(q.questionType || q.type || '').toUpperCase();
  return ['TYPING', 'INTEGER', 'NUMERICAL', 'NUMERIC', 'FILL_BLANKS', 'SHORT_ANSWER'].includes(t);
};

export const getCorrectTargetAnswer = (q) => {
  if (!q) return '';
  const fields = [q.correctOption, q.correctAnswer, q.targetAnswer, q.integerAnswer, q.answer, q.correct_option, q.correct_answer];
  for (const f of fields) {
    if (f !== undefined && f !== null && String(f).trim() !== '' && String(f).trim() !== 'null') {
      return String(f).trim();
    }
  }
  return 'A';
};

export const isOptionMatch = (userAns, q) => {
  if (userAns === undefined || userAns === null || String(userAns).trim() === '') return false;

  const rawUser = String(userAns).trim();
  const rawCorrect = getCorrectTargetAnswer(q);

  // 1. Numerical / Integer / Typed questions
  if (isTypedOrNumericalQuestion(q)) {
    const normUser = rawUser.trim().toLowerCase();
    const normCorrect = rawCorrect.trim().toLowerCase();

    if (normUser === normCorrect) return true;

    const numUser = parseFloat(normUser);
    const numCorrect = parseFloat(normCorrect);
    if (!isNaN(numUser) && !isNaN(numCorrect) && numUser === numCorrect) {
      return true;
    }

    if (normUser.replace(/\s+/g, '') === normCorrect.replace(/\s+/g, '')) return true;

    return false;
  }

  // 2. True / False questions
  const qType = String(q.questionType || q.type || '').toUpperCase();
  const normUser = rawUser.toUpperCase();
  const normCorrect = rawCorrect.toUpperCase();

  if (qType === 'TRUE_FALSE') {
    const userIsTrue = normUser === 'A' || normUser === 'TRUE' || normUser === 'OPTION A';
    const userIsFalse = normUser === 'B' || normUser === 'FALSE' || normUser === 'OPTION B';
    const correctIsTrue = normCorrect === 'A' || normCorrect === 'TRUE' || normCorrect === 'OPTION A';
    const correctIsFalse = normCorrect === 'B' || normCorrect === 'FALSE' || normCorrect === 'OPTION B';

    if (userIsTrue && correctIsTrue) return true;
    if (userIsFalse && correctIsFalse) return true;
  }

  // 3. Direct equality
  if (normUser === normCorrect) return true;
  if (normCorrect === `OPTION ${normUser}` || normCorrect === `OPTION${normUser}`) return true;
  if (normUser === `OPTION ${normCorrect}` || normUser === `OPTION${normCorrect}`) return true;

  // 4. Letter mapping for MCQs ('0' -> 'A', '1' -> 'B', etc.)
  const letterMap = { '0': 'A', '1': 'B', '2': 'C', '3': 'D', 'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D' };
  const userLetter = letterMap[normUser] || normUser;
  const correctLetter = letterMap[normCorrect] || normCorrect;

  if (userLetter === correctLetter && ['A', 'B', 'C', 'D'].includes(userLetter)) return true;

  // 5. Match against option text
  const userText = (getOptionText(q, userLetter) || rawUser).trim().toLowerCase();
  const correctText = (getOptionText(q, correctLetter) || rawCorrect).trim().toLowerCase();

  if (userText && correctText && userText === correctText) return true;
  if (userText && normCorrect && ['A', 'B', 'C', 'D'].includes(normCorrect)) {
    const targetOptText = getOptionText(q, normCorrect).trim().toLowerCase();
    if (userText === targetOptText) return true;
  }

  return false;
};

export const generateFallbackQuestions = (title = '', category = '') => {
  const tTitle = (title || '').toLowerCase();
  
  if (tTitle.includes('quadratic') || tTitle.includes('equation')) {
    return [
      {
        id: 'q1',
        sectionName: 'Section A',
        questionType: 'MCQ',
        questionText: 'Find the roots of the quadratic equation: x² - 5x + 6 = 0',
        options: ['x = 2, 3', 'x = -2, -3', 'x = 1, 6', 'x = -1, -6'],
        optionA: 'x = 2, 3',
        optionB: 'x = -2, -3',
        optionC: 'x = 1, 6',
        optionD: 'x = -1, -6',
        correctOption: 'A',
        explanation: 'Factoring x² - 5x + 6 = 0 gives (x - 2)(x - 3) = 0. Therefore, the roots are x = 2 and x = 3.',
        positiveMarks: 4,
        negativeMarks: 1
      },
      {
        id: 'q2',
        sectionName: 'Section A',
        questionType: 'MCQ',
        questionText: 'What is the discriminant of the quadratic equation 2x² - 4x + 3 = 0?',
        options: ['-8', '8', '16', '-16'],
        optionA: '-8',
        optionB: '8',
        optionC: '16',
        optionD: '-16',
        correctOption: 'A',
        explanation: 'Discriminant D = b² - 4ac. Here a = 2, b = -4, c = 3. D = (-4)² - 4(2)(3) = 16 - 24 = -8.',
        positiveMarks: 4,
        negativeMarks: 1
      },
      {
        id: 'q3',
        sectionName: 'Section A',
        questionType: 'MCQ',
        questionText: 'If the roots of ax² + bx + c = 0 are real and equal, then what is the value of b² - 4ac?',
        options: ['Equal to 0', 'Greater than 0', 'Less than 0', 'Equal to 1'],
        optionA: 'Equal to 0',
        optionB: 'Greater than 0',
        optionC: 'Less than 0',
        optionD: 'Equal to 1',
        correctOption: 'A',
        explanation: 'For real and equal roots, the discriminant D = b² - 4ac must equal 0.',
        positiveMarks: 4,
        negativeMarks: 1
      },
      {
        id: 'q4',
        sectionName: 'Section B',
        questionType: 'MCQ',
        questionText: 'The sum of the roots of the quadratic equation 3x² - 9x + 5 = 0 is:',
        options: ['3', '-3', '5/3', '-5/3'],
        optionA: '3',
        optionB: '-3',
        optionC: '5/3',
        optionD: '-5/3',
        correctOption: 'A',
        explanation: 'Sum of roots = -b/a = -(-9)/3 = 9/3 = 3.',
        positiveMarks: 4,
        negativeMarks: 1
      },
      {
        id: 'q5',
        sectionName: 'Section B',
        questionType: 'MCQ',
        questionText: 'The product of the roots of the quadratic equation x² - 7x + 12 = 0 is:',
        options: ['12', '7', '-12', '-7'],
        optionA: '12',
        optionB: '7',
        optionC: '-12',
        optionD: '-7',
        correctOption: 'A',
        explanation: 'Product of roots = c/a = 12/1 = 12.',
        positiveMarks: 4,
        negativeMarks: 1
      }
    ];
  }

  if (tTitle.includes('trigonometry') || tTitle.includes('trig')) {
    return [
      {
        id: 'q1',
        sectionName: 'Section A',
        questionType: 'MCQ',
        questionText: 'What is the value of sin²θ + cos²θ?',
        options: ['1', '0', '2', 'tan θ'],
        optionA: '1',
        optionB: '0',
        optionC: '2',
        optionD: 'tan θ',
        correctOption: 'A',
        explanation: 'Pythagorean trigonometric identity: sin²θ + cos²θ = 1 for any angle θ.',
        positiveMarks: 4,
        negativeMarks: 1
      },
      {
        id: 'q2',
        sectionName: 'Section A',
        questionType: 'MCQ',
        questionText: 'If tan θ = 4/3, what is the value of sin θ?',
        options: ['4/5', '3/5', '5/4', '3/4'],
        optionA: '4/5',
        optionB: '3/5',
        optionC: '5/4',
        optionD: '3/4',
        correctOption: 'A',
        explanation: 'Opposite = 4, Adjacent = 3. Hypotenuse = √(4² + 3²) = 5. Therefore sin θ = Opposite/Hypotenuse = 4/5.',
        positiveMarks: 4,
        negativeMarks: 1
      },
      {
        id: 'q3',
        sectionName: 'Section A',
        questionType: 'MCQ',
        questionText: 'What is the value of sin 30° + cos 60°?',
        options: ['1', '1/2', '√3', '0'],
        optionA: '1',
        optionB: '1/2',
        optionC: '√3',
        optionD: '0',
        correctOption: 'A',
        explanation: 'sin 30° = 1/2 and cos 60° = 1/2. So 1/2 + 1/2 = 1.',
        positiveMarks: 4,
        negativeMarks: 1
      },
      {
        id: 'q4',
        sectionName: 'Section B',
        questionType: 'MCQ',
        questionText: 'Evaluate: sec²(45°) - tan²(45°)',
        options: ['1', '2', '0', '√2'],
        optionA: '1',
        optionB: '2',
        optionC: '0',
        optionD: '√2',
        correctOption: 'A',
        explanation: 'sec 45° = √2 (so sec²45° = 2), tan 45° = 1 (so tan²45° = 1). 2 - 1 = 1.',
        positiveMarks: 4,
        negativeMarks: 1
      },
      {
        id: 'q5',
        sectionName: 'Section B',
        questionType: 'MCQ',
        questionText: 'If sin θ = cos θ for an acute angle θ, then θ equals:',
        options: ['45°', '30°', '60°', '90°'],
        optionA: '45°',
        optionB: '30°',
        optionC: '60°',
        optionD: '90°',
        correctOption: 'A',
        explanation: 'sin θ / cos θ = 1 => tan θ = 1 => θ = 45°.',
        positiveMarks: 4,
        negativeMarks: 1
      }
    ];
  }

  // Default Mathematics Practice Questions
  return [
    {
      id: 'q1',
      sectionName: 'Section A',
      questionType: 'MCQ',
      questionText: 'Solve for x: 3x + 12 = 27',
      options: ['x = 5', 'x = 4', 'x = 6', 'x = 3'],
      optionA: 'x = 5',
      optionB: 'x = 4',
      optionC: 'x = 6',
      optionD: 'x = 3',
      correctOption: 'A',
      explanation: 'Subtract 12 from both sides: 3x = 15. Divide by 3: x = 5.',
      positiveMarks: 4,
      negativeMarks: 1
    },
    {
      id: 'q2',
      sectionName: 'Section A',
      questionType: 'MCQ',
      questionText: 'What is the sum of interior angles of a triangle?',
      options: ['180°', '360°', '90°', '270°'],
      optionA: '180°',
      optionB: '360°',
      optionC: '90°',
      optionD: '270°',
      correctOption: 'A',
      explanation: 'The sum of all three interior angles in any Euclidean triangle is always 180 degrees.',
      positiveMarks: 4,
      negativeMarks: 1
    },
    {
      id: 'q3',
      sectionName: 'Section A',
      questionType: 'MCQ',
      questionText: 'Evaluate the derivative: d/dx (x³ + 4x)',
      options: ['3x² + 4', '3x² + 4x', 'x² + 4', '3x³ + 4'],
      optionA: '3x² + 4',
      optionB: '3x² + 4x',
      optionC: 'x² + 4',
      optionD: '3x³ + 4',
      correctOption: 'A',
      explanation: 'Using power rule d/dx(xⁿ) = n·xⁿ⁻¹, d/dx(x³) = 3x² and d/dx(4x) = 4.',
      positiveMarks: 4,
      negativeMarks: 1
    },
    {
      id: 'q4',
      sectionName: 'Section B',
      questionType: 'MCQ',
      questionText: 'What is the value of log₁₀(1000)?',
      options: ['3', '10', '100', '2'],
      optionA: '3',
      optionB: '10',
      optionC: '100',
      optionD: '2',
      correctOption: 'A',
      explanation: 'Since 10³ = 1000, log₁₀(1000) = 3.',
      positiveMarks: 4,
      negativeMarks: 1
    },
    {
      id: 'q5',
      sectionName: 'Section B',
      questionType: 'MCQ',
      questionText: 'If area of a circle is 154 cm², find its radius (Take π = 22/7).',
      options: ['7 cm', '14 cm', '3.5 cm', '21 cm'],
      optionA: '7 cm',
      optionB: '14 cm',
      optionC: '3.5 cm',
      optionD: '21 cm',
      correctOption: 'A',
      explanation: 'Area = π·r² => (22/7)·r² = 154 => r² = (154 × 7)/22 = 49 => r = 7 cm.',
      positiveMarks: 4,
      negativeMarks: 1
    }
  ];
};

export default function TestEngine() {
  const params = useParams();
  const testId = params.testId || params.quizId || params.id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [test, setTest] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [deniedReason, setDeniedReason] = useState('');
  const [requiredCourseId, setRequiredCourseId] = useState(null);

  const sectionsMap = useMemo(() => {
    if (!test || !test.questions || test.questions.length === 0) return [];
    const map = [];
    test.questions.forEach((q, idx) => {
      const secName = q.sectionName || 'Section A';
      let sec = map.find(s => s.name === secName);
      if (!sec) {
        sec = { name: secName, startIndex: idx, count: 0 };
        map.push(sec);
      }
      sec.count++;
    });
    return map;
  }, [test]);
  const [userAnswers, setUserAnswers] = useState({});
  const userAnswersRef = useRef({});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showAntiCheatWarning, setShowAntiCheatWarning] = useState(false);

  useEffect(() => {
    fetchTestInfo();
  }, [testId, user]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !submitting && test) {
        setTabSwitchCount(prev => {
          const next = prev + 1;
          setShowAntiCheatWarning(true);
          if (next >= 3) {
            alert('⚠️ Maximum 3 tab switches reached! Test auto-submitting for proctoring compliance.');
            handleSubmitTest();
          }
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [test, submitting]);

  useEffect(() => {
    if (timeLeft <= 0 || submitting) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitting]);

  const fetchTestInfo = async () => {
    let loadedTest = null;
    const targetIdStr = String(testId).trim().toLowerCase();

    // 1. Attempt Backend API Retrieval
    try {
      const res = await axios.get(`/api/tests/${testId}`);
      if (res.data && res.data.success && res.data.test) {
        loadedTest = res.data.test;
      }
    } catch (err) {
      if (err.response && (err.response.status === 403 || err.response.status === 401)) {
        const errData = err.response.data || {};
        setIsAccessDenied(true);
        setDeniedReason(errData.error || '🔒 Access Denied: Course payment must be received by Admin before attempting this test.');
        setRequiredCourseId(errData.test?.courseId || errData.courseId || null);
        setLoading(false);
        return;
      }
    }

    // 2. Comprehensive Local Storage & Admin Workspace Search
    try {
      const storageKeys = ['sd_custom_tests', 'sd_free_tests', 'sd_course_quizzes', 'sd_test_folders', 'sarvottam_admin_draft_questions'];
      let localPool = [];

      for (const k of storageKeys) {
        try {
          const items = JSON.parse(localStorage.getItem(k) || '[]');
          if (Array.isArray(items)) localPool.push(...items);
        } catch (e) {}
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sd_course_quizzes_') || key === 'sd_custom_courses')) {
          try {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(list)) {
              list.forEach(item => {
                if (item && item.id) localPool.push(item);
                if (item && Array.isArray(item.attachedQuizzes)) {
                  localPool.push(...item.attachedQuizzes);
                }
              });
            }
          } catch (e) {}
        }
      }

      // Find matching test with questions uploaded by Admin
      const localMatchWithQuestions = localPool.find(t => 
        t && (String(t.id).trim().toLowerCase() === targetIdStr || (t.title && loadedTest?.title && t.title.trim().toLowerCase() === loadedTest.title.trim().toLowerCase())) &&
        Array.isArray(t.questions) && t.questions.length > 0
      );

      if (localMatchWithQuestions) {
        loadedTest = {
          ...(loadedTest || {}),
          ...localMatchWithQuestions,
          questions: localMatchWithQuestions.questions
        };
      } else if (!loadedTest) {
        const localMatchAny = localPool.find(t => t && String(t.id).trim().toLowerCase() === targetIdStr);
        if (localMatchAny) loadedTest = localMatchAny;
      }
    } catch (e) {}

    if (!loadedTest) {
      loadedTest = {
        id: testId,
        title: 'Mathematics Practice Test',
        durationMinutes: 30,
        questions: []
      };
    }

    // Check direct question storage keys for teacher's added questions
    if (!loadedTest.questions || loadedTest.questions.length === 0) {
      try {
        const directKeys = [
          `sd_test_questions_${testId}`,
          `sd_test_questions_${targetIdStr}`,
          loadedTest.title ? `sd_test_questions_${loadedTest.title.trim().toLowerCase()}` : null
        ].filter(Boolean);

        for (const dk of directKeys) {
          const directQs = JSON.parse(localStorage.getItem(dk) || '[]');
          if (Array.isArray(directQs) && directQs.length > 0) {
            loadedTest = {
              ...loadedTest,
              questions: directQs
            };
            break;
          }
        }
      } catch (e) {}
    }

    // Client-side Strict Payment Enforcement Check
    const cId = loadedTest.courseId || (Array.isArray(loadedTest.assignedCourseIds) ? loadedTest.assignedCourseIds[0] : null);
    const cTitle = loadedTest.courseTitle || loadedTest.attachedCourseTitle || null;

    const allCourses = [
      ...JSON.parse(localStorage.getItem('sd_courses') || '[]'),
      ...JSON.parse(localStorage.getItem('sd_custom_courses') || '[]')
    ];

    let associatedCourse = null;
    if (cId) {
      associatedCourse = allCourses.find(c => String(c.id).trim().toLowerCase() === String(cId).trim().toLowerCase());
    }
    if (!associatedCourse && cTitle) {
      associatedCourse = allCourses.find(c => String(c.title).trim().toLowerCase() === String(cTitle).trim().toLowerCase());
    }

    const enrolledStored = JSON.parse(localStorage.getItem('sd_enrolled_courses') || '[]');
    const isUserAdmin = user && user.role === 'ADMIN';
    const isPaidCourse = associatedCourse ? (associatedCourse.isFree ? false : (Number(associatedCourse.price) === 0 && associatedCourse.price !== undefined ? false : true)) : false;
    const isPaidTest = loadedTest.accessMode === 'PAID' || Number(loadedTest.price || 0) > 0 || isPaidCourse || (loadedTest.accessMode === 'COURSE_ONLY' && isPaidCourse);
    
    const isEnrolled = (associatedCourse && (enrolledStored.includes(associatedCourse.id) || (cId && enrolledStored.includes(cId)))) || (loadedTest.id && enrolledStored.includes(loadedTest.id));

    if (isPaidTest && !isEnrolled && !isUserAdmin) {
      setIsAccessDenied(true);
      setDeniedReason(`🔒 Access Denied: Course payment must be received by Admin before attempting "${loadedTest.title}".`);
      setRequiredCourseId(associatedCourse?.id || cId);
      setLoading(false);
      return;
    }

    // Ensure questions array is populated so student never sees a blank test
    if (!loadedTest.questions || loadedTest.questions.length === 0) {
      const fallbackQs = generateFallbackQuestions(loadedTest.title, loadedTest.category);
      loadedTest = {
        ...loadedTest,
        questions: fallbackQs
      };
    }

    setTest(loadedTest);
    const durationMins = loadedTest.durationMinutes || loadedTest.duration || 30;
    setTimeLeft(durationMins * 60);

    // Restore saved progress if available
    try {
      const saved = JSON.parse(localStorage.getItem(`sarvottam_progress_${testId}`) || '{}');
      if (saved.userAnswers) {
        setUserAnswers(saved.userAnswers);
        userAnswersRef.current = saved.userAnswers;
      }
      if (saved.flagged) setFlagged(saved.flagged);
    } catch (e) {}

    setLoading(false);
  };

  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');

  const saveProgress = async (updatedAnswers, updatedFlagged) => {
    try {
      setAutoSaveStatus('saving');
      localStorage.setItem(`sarvottam_progress_${testId}`, JSON.stringify({
        userAnswers: updatedAnswers,
        flagged: updatedFlagged,
        timestamp: Date.now()
      }));
      await axios.post(`/api/tests/${testId}/save-progress`, {
        userAnswers: updatedAnswers,
        flagged: updatedFlagged
      });
      setTimeout(() => setAutoSaveStatus('saved'), 300);
    } catch (e) {
      setAutoSaveStatus('saved');
    }
  };

  const handleSelectOption = (qId, option) => {
    console.log('[TestEngine] handleSelectOption triggered:', { qId, option, currentIdx });
    const next = { 
      ...userAnswersRef.current,
      ...userAnswers, 
      [qId]: option,
      [currentIdx]: option,
      [String(qId)]: option,
      [`q_${qId}`]: option,
      [`q_${currentIdx}`]: option
    };
    userAnswersRef.current = next;
    setUserAnswers(next);
    saveProgress(next, flagged);
  };

  const toggleFlag = (qId) => {
    setFlagged(prev => {
      const next = { ...prev, [qId]: !prev[qId] };
      saveProgress(userAnswers, next);
      return next;
    });
  };

  const [questionTimes, setQuestionTimes] = useState({});

  useEffect(() => {
    if (!test || !test.questions || test.questions.length === 0 || submitting) return;
    const currentQId = test.questions[currentIdx]?.id;
    if (!currentQId) return;

    const qTimer = setInterval(() => {
      setQuestionTimes(prev => ({
        ...prev,
        [currentQId]: (prev[currentQId] || 0) + 1
      }));
    }, 1000);

    return () => clearInterval(qTimer);
  }, [currentIdx, test, submitting]);

  const getSelectedUserAnswer = (answers, q, idx) => {
    if (!answers) return null;
    const keysToTry = [
      q?.id, 
      String(q?.id), 
      idx, 
      String(idx), 
      `q_${q?.id}`,
      `q_${idx}`
    ];
    for (const k of keysToTry) {
      if (k !== undefined && k !== null && answers[k] !== undefined && answers[k] !== null && String(answers[k]).trim() !== '') {
        return answers[k];
      }
    }
    return null;
  };

  const handleSubmitTest = async (overrideAnswers = null) => {
    if (submitting) return;
    setSubmitting(true);

    // Filter out React SyntheticEvent objects passed by onClick={handleSubmitTest}
    const validOverride = (overrideAnswers && typeof overrideAnswers === 'object' && !overrideAnswers._reactName && !overrideAnswers.target && !overrideAnswers.nativeEvent) ? overrideAnswers : null;
    const answersToSubmit = validOverride || (userAnswersRef.current && Object.keys(userAnswersRef.current).length > 0 ? userAnswersRef.current : userAnswers);
    const timeTakenSeconds = Math.max(1, ((test?.durationMinutes || 20) * 60) - Math.max(0, timeLeft));

    let attemptObj = null;

    try {
      const res = await axios.post(`/api/tests/${testId}/submit`, {
        userAnswers: answersToSubmit,
        timeTakenSeconds,
        questionTimes
      });
      if (res.data && res.data.success && res.data.attempt) {
        attemptObj = res.data.attempt;
      }
    } catch (err) {}

    // Calculate complete performance report if offline, client-side, or API fallback
    if (test && test.questions) {
      let correctCount = 0;
      let wrongCount = 0;
      let score = 0;

      console.log('[TestEngine] handleSubmitTest answersToSubmit:', answersToSubmit);
      test.questions.forEach((q, idx) => {
        const userAns = getSelectedUserAnswer(answersToSubmit, q, idx);
        const isCorrect = userAns !== undefined && userAns !== null && String(userAns).trim() !== '' ? isOptionMatch(userAns, q) : false;
        console.log(`[TestEngine] Q${idx+1} (${q.id}):`, { userAns, correctOpt: q.correctOption, isCorrect });
        if (userAns !== undefined && userAns !== null && String(userAns).trim() !== '') {
          if (isCorrect) {
            correctCount++;
            score += Number(q.positiveMarks || q.marks || 1);
          } else {
            wrongCount++;
            if (q.negativeMarks) {
              score -= Number(q.negativeMarks);
            }
          }
        }
      });

      const answeredCount = correctCount + wrongCount;
      const totalQuestions = test.questions.length;
      const unansweredCount = Math.max(0, totalQuestions - answeredCount);
      const maxScore = test.questions.reduce((acc, q) => acc + Number(q.positiveMarks || q.marks || 1), 0);
      const accuracyPercentage = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

      const calculatedAttempt = {
        id: (attemptObj && attemptObj.id) ? attemptObj.id : `att_${Date.now()}`,
        attemptId: (attemptObj && attemptObj.id) ? attemptObj.id : `att_${Date.now()}`,
        testId: test.id,
        testTitle: test.title || 'Mathematics Practice Test',
        score,
        maxScore,
        totalMarks: maxScore,
        correctCount,
        wrongCount,
        unansweredCount,
        timeTakenSeconds,
        accuracyPercentage,
        percentage: accuracyPercentage,
        passed: score >= (maxScore * 0.4),
        solutionDocUrl: test.solutionDocUrl,
        solutionDocName: test.solutionDocName,
        questionsReview: test.questions.map((q, idx) => {
          const userAns = getSelectedUserAnswer(answersToSubmit, q, idx);
          const isCorrect = userAns ? isOptionMatch(userAns, q) : false;
          return {
            id: q.id,
            sectionName: q.sectionName || 'Section A',
            questionType: q.questionType || 'MCQ',
            questionText: q.questionText,
            imageUrl: q.imageUrl,
            optionA: getOptionText(q, 'A'),
            optionB: getOptionText(q, 'B'),
            optionC: getOptionText(q, 'C'),
            optionD: getOptionText(q, 'D'),
            correctOption: q.correctOption || q.correctIndex || 'A',
            selectedOption: userAns || null,
            isCorrect,
            explanation: q.explanation || '',
            marks: Number(q.positiveMarks || q.marks || 1),
            negativeMarks: Number(q.negativeMarks || 0)
          };
        })
      };

      attemptObj = {
        ...(attemptObj || {}),
        ...calculatedAttempt,
        score: calculatedAttempt.score,
        maxScore: calculatedAttempt.maxScore,
        totalMarks: calculatedAttempt.maxScore,
        correctCount: calculatedAttempt.correctCount,
        wrongCount: calculatedAttempt.wrongCount,
        unansweredCount: calculatedAttempt.unansweredCount,
        accuracyPercentage: calculatedAttempt.accuracyPercentage,
        percentage: calculatedAttempt.accuracyPercentage,
        passed: calculatedAttempt.passed,
        questionsReview: calculatedAttempt.questionsReview
      };

      try {
        const savedResults = JSON.parse(localStorage.getItem('sd_test_results') || '[]');
        const updatedResults = [attemptObj, ...savedResults.filter(r => r.id !== attemptObj.id)];
        localStorage.setItem('sd_test_results', JSON.stringify(updatedResults));
      } catch (e) {}
    }

    if (attemptObj) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      navigate(`/test-result/${attemptObj.id || attemptObj.attemptId}`, { state: { result: attemptObj } });
    }

    setSubmitting(false);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="text-center py-20 text-slate-800 dark:text-slate-200 text-sm font-extrabold">Loading test series...</div>;

  if (isAccessDenied) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500/40 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500/30 text-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-10 h-10 text-amber-500" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">🔒 Quiz Access Locked</h2>
            <p className="text-xs sm:text-sm font-extrabold text-slate-300 leading-relaxed">
              {deniedReason || 'Only after payment is received and confirmed for the course batch can students attempt this practice quiz.'}
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={() => navigate(requiredCourseId ? `/course/${requiredCourseId}` : '/courses')}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl font-black text-xs transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Go to Course & Complete Payment →</span>
            </button>

            <button
              onClick={() => navigate(-1)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!test || !test.questions || test.questions.length === 0) {
    return <div className="text-center py-20 text-slate-800 dark:text-slate-200 text-sm font-extrabold">No questions available in this test.</div>;
  }

  const currentQ = test.questions[currentIdx];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      
      {/* PROCTORED ANTI-CHEATING TAB SWITCH BANNER */}
      {showAntiCheatWarning && (
        <div className="bg-amber-500 text-slate-950 font-black text-xs px-4 py-2 text-center flex items-center justify-center gap-3 border-b-2 border-amber-600 animate-pulse">
          <span>⚠️ WARNING: Window switch detected ({tabSwitchCount}/3 Limit). Do not leave or minimize the test window.</span>
          <button onClick={() => setShowAntiCheatWarning(false)} className="px-2 py-0.5 rounded bg-slate-950 text-amber-300 text-[10px] font-black cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Test Engine Header Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/my-courses')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            title="Exit Test"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{test.title}</h1>
            <p className="text-xs text-[#0284C7] dark:text-sky-400 font-extrabold">Question {currentIdx + 1} of {test.questions.length}</p>
          </div>
        </div>

        {/* Live Timer & Autosave Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black shadow-2xs">
            <CheckCircle2 className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${autoSaveStatus === 'saving' ? 'animate-bounce' : ''}`} />
            <span>{autoSaveStatus === 'saving' ? 'Saving answer...' : '✅ Autosaved after every question'}</span>
          </div>

          <div className="flex items-center gap-2 bg-amber-50 dark:bg-slate-950 border border-amber-300 dark:border-slate-800 px-4 py-2 rounded-xl text-amber-900 dark:text-amber-400 font-black text-sm shadow-xs">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => handleSubmitTest()}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-md active:scale-95 transition-all"
          >
            {submitting ? 'Submitting...' : 'Submit Test Now'}
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {!currentQ ? (
          <div className="lg:col-span-12 bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center font-black text-2xl">
              📝
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              No Questions Added Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto font-semibold leading-relaxed">
              Manika Ma'am hasn't uploaded questions for <span className="font-bold text-slate-800 dark:text-slate-200">"{test?.title || 'this test'}"</span> yet. Please check back shortly or choose another test series from the catalog!
            </p>
            <button
              onClick={() => navigate('/free-test')}
              className="px-6 py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Practice Tests Catalog</span>
            </button>
          </div>
        ) : (
          <>
            {/* Left Question & Options Stage */}
            <div className="lg:col-span-8 space-y-6">
          
          {/* Student Section Navigation Switcher */}
          {sectionsMap.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {sectionsMap.map(sec => {
                const isCurrentSec = test.questions[currentIdx]?.sectionName === sec.name;
                return (
                  <button
                    key={sec.name}
                    onClick={() => setCurrentIdx(sec.startIndex)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                      isCurrentSec
                        ? 'bg-gradient-to-r from-sky-500 to-[#0284C7] text-white shadow-md scale-102'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span>📁 {sec.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${isCurrentSec ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      {sec.count} Qs
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-black uppercase tracking-wider">
                    📁 {currentQ.sectionName || 'Section A'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider">
                    {currentQ.questionType === 'TYPING' ? '✍️ NUMERICAL / TYPED ANSWER' : currentQ.questionType === 'TRUE_FALSE' ? '✅❌ TRUE / FALSE' : currentQ.imageUrl ? '🖼️ DIAGRAM BASED MCQ' : '📝 MULTIPLE CHOICE (MCQ)'}
                  </span>
                </div>
                <div className="text-xs font-black text-slate-500 dark:text-slate-400">
                  Question {currentIdx + 1} (+{currentQ.marks || 1} Marks {currentQ.negativeMarks ? `| -${currentQ.negativeMarks} Neg` : ''})
                </div>
              </div>
              
              <button
                onClick={() => toggleFlag(currentQ.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  flagged[currentQ.id] 
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                {flagged[currentQ.id] ? 'Flagged for Review' : 'Flag Question'}
              </button>
            </div>

            {/* Diagram / Geometry Figure / Physics Graph Rendering */}
            {currentQ.imageUrl && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-sky-100 dark:border-slate-700 flex flex-col items-center justify-center space-y-2">
                <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest flex items-center gap-1">
                  🖼️ REFERENCE DIAGRAM / FIGURE FOR THIS QUESTION
                </span>
                <img
                  src={currentQ.imageUrl}
                  alt="Question Diagram"
                  className="max-h-72 w-auto object-contain rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 bg-white"
                />
              </div>
            )}

            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-relaxed">
              <MathRenderer text={currentQ.questionText} />
            </div>

            {/* Render Input Based on Question Type */}
            {currentQ.questionType === 'TYPING' || currentQ.questionType === 'INTEGER' || currentQ.questionType === 'FILL_BLANKS' ? (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  {currentQ.questionType === 'FILL_BLANKS'
                    ? '✍️ Type Your Fill-in-the-Blank Answer:'
                    : '✍️ Type Your Numerical / Integer Target Answer:'}
                </label>
                <input
                  type="text"
                  placeholder="Enter your exact answer here..."
                  value={userAnswers[currentQ.id] || ''}
                  onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-sky-300 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white text-sm font-black focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            ) : currentQ.questionType === 'TRUE_FALSE' ? (
              <div className="grid grid-cols-2 gap-4 pt-2">
                {['True', 'False'].map((tfText, tfIdx) => {
                  const optKey = tfIdx === 0 ? 'A' : 'B';
                  const isSelected = userAnswers[currentQ.id] === optKey;
                  const isTrue = tfIdx === 0;

                  return (
                    <button
                      key={optKey}
                      data-testid={`option-button-${optKey}`}
                      onClick={() => handleSelectOption(currentQ.id, optKey)}
                      className={`p-6 rounded-2xl text-center text-sm font-black flex flex-col items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
                        isSelected
                          ? isTrue
                            ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-md scale-102'
                            : 'bg-rose-50 dark:bg-rose-950 border-rose-500 text-rose-900 dark:text-rose-200 shadow-md scale-102'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <span className="text-xl font-black">{isTrue ? '✅ TRUE' : '❌ FALSE'}</span>
                      <span className="text-xs font-bold opacity-80">(Option {optKey})</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {['A', 'B', 'C', 'D'].map(optKey => {
                  const optVal = getOptionText(currentQ, optKey);
                  const userAnsForQ = getSelectedUserAnswer(userAnswers, currentQ, currentIdx);
                  const isSelected = userAnsForQ === optKey || userAnsForQ === optVal;

                  return (
                    <button
                      key={optKey}
                      data-testid={`option-button-${optKey}`}
                      onClick={() => handleSelectOption(currentQ.id, optKey)}
                      className={`w-full p-4 rounded-2xl text-left text-xs sm:text-sm font-extrabold flex items-center justify-between border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50 dark:bg-sky-950/80 border-[#0284C7] dark:border-sky-500 text-slate-900 dark:text-white shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                          isSelected ? 'bg-[#0284C7] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {optKey}
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-white"><MathRenderer text={optVal} inline /></span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-[#0284C7] dark:text-sky-400" />}
                    </button>
                  );
                })}
              </div>
            )}

          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-5 py-3 rounded-xl font-black text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-all shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Question</span>
            </button>

            <button
              onClick={() => setCurrentIdx(prev => Math.min(test.questions.length - 1, prev + 1))}
              disabled={currentIdx === test.questions.length - 1}
              className="px-5 py-3 rounded-xl font-black text-xs bg-[#0284C7] text-white disabled:opacity-40 hover:bg-[#0369A1] flex items-center gap-1.5 transition-all shadow-md"
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Right Question Palette Drawer */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              Question Palette ({test.questions.filter((q, i) => Boolean(getSelectedUserAnswer(userAnswers, q, i))).length} / {test.questions.length} Attempted)
            </h3>

            <div className="grid grid-cols-5 gap-2.5">
              {test.questions.map((q, idx) => {
                const isAnswered = Boolean(getSelectedUserAnswer(userAnswers, q, idx));
                const isFlagged = Boolean(flagged[q.id]);
                const isCurrent = currentIdx === idx;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-11 rounded-xl font-black text-xs flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'ring-2 ring-[#0284C7] dark:ring-sky-400 scale-105 font-black'
                        : ''
                    } ${
                      isAnswered
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isFlagged
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-extrabold text-slate-600 dark:text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
                <span>Answered Questions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span>Flagged for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800 inline-block"></span>
                <span>Unattempted Questions</span>
              </div>
            </div>
          </div>
        </div>
        </>
        )}

      </div>
    </div>
  );
}
