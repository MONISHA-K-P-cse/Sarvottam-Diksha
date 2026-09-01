import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import MathRenderer from '../components/math/MathRenderer';
import { getOptionText, isTypedOrNumericalQuestion, getCorrectTargetAnswer } from './TestEngine';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  ArrowLeft, 
  RotateCcw,
  Sparkles,
  BookOpen,
  FileText,
  Download
} from 'lucide-react';

export default function TestResult() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);

  useEffect(() => {
    // If we already have a valid calculated result passed via location.state, preserve it!
    if (location.state?.result && Array.isArray(location.state.result.questionsReview) && location.state.result.questionsReview.length > 0) {
      setResult(location.state.result);
      setLoading(false);
      return;
    }
    fetchAttemptResult();
  }, [attemptId]);

  const fetchAttemptResult = async () => {
    const savedResults = JSON.parse(localStorage.getItem('sd_test_results') || '[]');
    const localMatch = savedResults.find(r => r && (r.id === attemptId || r.attemptId === attemptId || String(r.testId) === String(attemptId)));

    try {
      const res = await axios.get(`/api/tests/attempts/${attemptId}`);
      if (res.data && res.data.success && res.data.attempt) {
        const att = res.data.attempt;
        const merged = {
          attemptId: att.id || localMatch?.id || attemptId,
          score: localMatch?.score ?? att.score ?? 0,
          maxScore: localMatch?.maxScore ?? att.maxScore ?? att.totalMarks ?? 100,
          correctCount: localMatch?.correctCount ?? att.correctCount ?? 0,
          wrongCount: localMatch?.wrongCount ?? att.wrongCount ?? 0,
          unansweredCount: localMatch?.unansweredCount ?? att.unansweredCount ?? 0,
          accuracyPercentage: localMatch?.accuracyPercentage ?? att.accuracyPercentage ?? att.percentage ?? 0,
          timeTakenSeconds: localMatch?.timeTakenSeconds ?? att.timeTakenSeconds ?? 0,
          passed: localMatch?.passed !== undefined ? localMatch.passed : (att.passed !== undefined ? att.passed : (((att.score ?? 0) / (att.maxScore || 100)) * 100 >= 40)),
          testTitle: localMatch?.testTitle || att.testTitle || att.test?.title || 'Practice Test Performance Report',
          solutionDocUrl: localMatch?.solutionDocUrl || att.solutionDocUrl || att.test?.solutionDocUrl,
          solutionDocName: localMatch?.solutionDocName || att.solutionDocName || att.test?.solutionDocName,
          teacherComment: localMatch?.teacherComment || att.teacherComment,
          isManualOverride: localMatch?.isManualOverride || att.isManualOverride,
          questionsReview: (localMatch?.questionsReview && localMatch.questionsReview.length > 0) ? localMatch.questionsReview : (att.questionsReview || [])
        };
        setResult(merged);
        setLoading(false);
        return;
      }
    } catch (err) {}

    // Fallback: Retrieve attempt result directly from localStorage
    if (localMatch) {
      setResult({
        attemptId: localMatch.id || localMatch.attemptId || attemptId,
        score: localMatch.score ?? 0,
        maxScore: localMatch.maxScore ?? localMatch.totalMarks ?? 100,
        correctCount: localMatch.correctCount ?? 0,
        wrongCount: localMatch.wrongCount ?? 0,
        unansweredCount: localMatch.unansweredCount ?? 0,
        accuracyPercentage: localMatch.accuracyPercentage ?? localMatch.percentage ?? 0,
        timeTakenSeconds: localMatch.timeTakenSeconds ?? 0,
        passed: Boolean(localMatch.passed),
        testTitle: localMatch.testTitle || 'Mathematics MCQ Practice Test',
        solutionDocUrl: localMatch.solutionDocUrl,
        solutionDocName: localMatch.solutionDocName,
        teacherComment: localMatch.teacherComment,
        isManualOverride: localMatch.isManualOverride,
        questionsReview: localMatch.questionsReview || []
      });
    }

    setLoading(false);
  };

  if (loading) return <div className="text-center py-20 text-slate-800 dark:text-slate-200 text-sm font-extrabold">Loading performance report...</div>;
  if (!result) return <div className="text-center py-20 text-slate-800 dark:text-slate-200 text-sm font-extrabold">Attempt result not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/my-courses')}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-black hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Courses
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0284C7] text-white text-xs font-black hover:bg-sky-700 shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Print / Save PDF Report
          </button>
          <span className="text-xs font-black text-[#0284C7] dark:text-sky-400">Official Evaluation Report</span>
        </div>
      </div>

      {/* Scorecard Hero Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-8 text-center border-2 border-orange-400">
        
        <div className="inline-flex p-4 rounded-full bg-white text-orange-600 shadow-md">
          <Award className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white">{result.testTitle}</h1>
          <p className="text-xs font-extrabold text-orange-100">Instant Automated MCQ Performance Scorecard</p>
        </div>

        {/* Score Pill */}
        <div className="max-w-xs mx-auto p-6 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 space-y-1">
          <span className="text-xs font-black uppercase tracking-wider text-orange-100 block">Your Final Score</span>
          <div className="text-4xl font-black text-white">
            {result.score} <span className="text-base text-orange-100 font-bold">/ {result.maxScore}</span>
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-black mt-2 shadow-xs ${
            result.passed ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500' : 'bg-rose-950/80 text-rose-300 border border-rose-500'
          }`}>
            {result.passed ? 'PASSED QUALIFYING CRITERIA' : 'NEEDS PRACTICE'}
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-4 border-t border-white/20">
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
            <span className="text-xs text-orange-100 block font-bold">Accuracy Rate</span>
            <span className="text-lg font-black text-white">{result.accuracyPercentage}%</span>
          </div>
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
            <span className="text-xs text-orange-100 block font-bold">Correct Answers</span>
            <span className="text-lg font-black text-emerald-200">{result.correctCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
            <span className="text-xs text-orange-100 block font-bold">Wrong Answers</span>
            <span className="text-lg font-black text-rose-200">{result.wrongCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
            <span className="text-xs text-orange-100 block font-bold">Time Taken</span>
            <span className="text-lg font-black text-amber-200">{Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s</span>
          </div>
        </div>

      </div>

      {/* Uploaded Word Document / PDF Solution File Banner */}
      {result.solutionDocUrl && (
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-sky-500">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block">SOLUTIONS FILE AVAILABLE</span>
              <h3 className="font-black text-base text-white">{result.solutionDocName || 'Official Quiz Solution Document'}</h3>
              <p className="text-xs text-sky-100 font-extrabold">Complete step-by-step solutions provided by Manika Ma'am.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (!result.solutionDocUrl) return;

              const fileName = result.solutionDocName || 'Official_Quiz_Solutions.pdf';
              const url = result.solutionDocUrl;

              if (url.startsWith('data:')) {
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              } else if (url.startsWith('blob:')) {
                fetch(url)
                  .then(res => res.blob())
                  .then(blob => {
                    const freshUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = freshUrl;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(freshUrl), 3000);
                  })
                  .catch(() => {
                    try {
                      const allCustomTests = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
                      const allCourseQuizzes = JSON.parse(localStorage.getItem('sd_course_quizzes') || '[]');
                      const match = [...allCustomTests, ...allCourseQuizzes].find(t => t.id === result.testId);
                      if (match && match.solutionDocUrl && match.solutionDocUrl.startsWith('data:')) {
                        const a = document.createElement('a');
                        a.href = match.solutionDocUrl;
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        return;
                      }
                    } catch (err) {}
                    alert("This solution document was saved using a temporary browser session blob that has expired. Please re-upload or update the quiz solutions in Admin Dashboard to download the latest copy!");
                  });
              } else {
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }
            }}
            className="px-6 py-3 rounded-2xl bg-white text-sky-700 hover:bg-sky-50 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Solutions (.docx / PDF)</span>
          </button>
        </div>
      )}

      {/* Teacher Comments & Evaluation Remarks Card */}
      {result.teacherComment && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 rounded-3xl text-white shadow-xl space-y-2 border-2 border-amber-400">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-amber-100 uppercase tracking-widest block">💬 TEACHER REMARKS & EVALUATION FEEDBACK</span>
            {result.isManualOverride && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black">
                ✏️ Score Verified & Adjusted by Teacher
              </span>
            )}
          </div>
          <p className="text-sm font-black leading-relaxed">{result.teacherComment}</p>
          <span className="text-xs text-amber-100 font-extrabold block">— Manika Maheshwari, Founder & Lead Educator</span>
        </div>
      )}

      {/* Answer Key & Step-by-Step Review */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Answer Key & Concept Explanations</h2>

        <div className="space-y-6">
          {result.questionsReview?.map((q, idx) => {
            const hasSelected = Boolean(q.selectedOption && String(q.selectedOption).trim() !== '' && q.selectedOption !== 'null');
            const isCorrect = Boolean(q.isCorrect);

            return (
              <div key={q.id || idx} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                
                <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#0284C7] dark:text-sky-400">Question {idx + 1} ({q.sectionName || 'Section A'})</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-black text-[10px]">
                      {isTypedOrNumericalQuestion(q) ? '✍️ NUMERICAL / TYPED' : q.questionType === 'TRUE_FALSE' ? '✅❌ TRUE / FALSE' : q.imageUrl ? '🖼️ DIAGRAM MCQ' : '📝 MULTIPLE CHOICE (MCQ)'}
                    </span>
                  </div>
                  <span className={`font-black px-3 py-1 rounded-full text-xs shadow-2xs ${
                    isCorrect 
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300' 
                      : hasSelected 
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300'
                  }`}>
                    {isCorrect ? '✓ CORRECT' : hasSelected ? '✗ INCORRECT' : '⚪ UNANSWERED'}
                  </span>
                </div>

                {q.imageUrl && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center space-y-1">
                    <span className="text-[9px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                      🖼️ Question Diagram / Figure
                    </span>
                    <img src={q.imageUrl} alt="Diagram" className="max-h-48 w-auto object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white" />
                  </div>
                )}

                <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-relaxed">
                  <MathRenderer text={q.questionText} />
                </div>

                {/* Options / Typed Answer Review */}
                {isTypedOrNumericalQuestion(q) ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700 space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-700 dark:text-slate-300">✍️ Your Submitted Answer:</span>
                      <span className={`font-black px-3.5 py-1.5 rounded-xl flex items-center gap-2 border ${
                        isCorrect 
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-400' 
                          : hasSelected 
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border-rose-400' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300'
                      }`}>
                        <MathRenderer text={hasSelected ? String(q.selectedOption) : '(Unanswered)'} inline />
                        {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                        {hasSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2.5">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400">🎯 Correct Target Answer:</span>
                      <span className="font-black text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/80 px-3.5 py-1.5 rounded-xl border border-emerald-400 flex items-center gap-2">
                        <MathRenderer text={getCorrectTargetAnswer(q)} inline />
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={`grid grid-cols-1 ${q.questionType === 'TRUE_FALSE' ? 'grid-cols-2' : 'sm:grid-cols-2'} gap-2 text-xs`}>
                    {(q.questionType === 'TRUE_FALSE' ? ['A', 'B'] : ['A', 'B', 'C', 'D']).map(optKey => {
                      const targetAns = getCorrectTargetAnswer(q);
                      const normCorrect = targetAns.toUpperCase();
                      
                      let isCorrectOpt = false;
                      if (q.questionType === 'TRUE_FALSE') {
                        const correctIsTrue = normCorrect === 'A' || normCorrect === 'TRUE' || normCorrect === 'OPTION A';
                        const correctIsFalse = normCorrect === 'B' || normCorrect === 'FALSE' || normCorrect === 'OPTION B';
                        isCorrectOpt = (optKey === 'A' && correctIsTrue) || (optKey === 'B' && correctIsFalse);
                      } else {
                        isCorrectOpt = normCorrect === optKey || normCorrect === `OPTION ${optKey}` || (targetAns && getOptionText(q, optKey).trim().toLowerCase() === targetAns.toLowerCase());
                      }

                      const normSelected = String(q.selectedOption || '').toUpperCase();
                      let isSelectedOpt = false;
                      if (q.questionType === 'TRUE_FALSE') {
                        const selectedIsTrue = normSelected === 'A' || normSelected === 'TRUE' || normSelected === 'OPTION A';
                        const selectedIsFalse = normSelected === 'B' || normSelected === 'FALSE' || normSelected === 'OPTION B';
                        isSelectedOpt = hasSelected && ((optKey === 'A' && selectedIsTrue) || (optKey === 'B' && selectedIsFalse));
                      } else {
                        isSelectedOpt = hasSelected && (
                          normSelected === optKey ||
                          normSelected === `OPTION ${optKey}` ||
                          (getOptionText(q, optKey).trim().toLowerCase() === String(q.selectedOption).trim().toLowerCase())
                        );
                      }

                      let optBg = 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-extrabold';
                      if (isCorrectOpt) optBg = 'bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-black shadow-2xs';
                      if (isSelectedOpt && !isCorrectOpt) optBg = 'bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500 text-rose-900 dark:text-rose-300 font-black shadow-2xs';

                      return (
                        <div key={optKey} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${optBg}`}>
                          <span><strong>{optKey}:</strong> <MathRenderer text={getOptionText(q, optKey)} inline /></span>
                          {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                          {isSelectedOpt && !isCorrectOpt && <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Explanation by Manika Ma'am */}
              {q.explanation && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-300 space-y-1">
                  <span className="font-black flex items-center gap-1 text-orange-600 dark:text-orange-400">
                    <Sparkles className="w-3.5 h-3.5" /> Concept Explanation by Manika Ma'am:
                  </span>
                  <div className="leading-relaxed font-extrabold">
                    <MathRenderer text={q.explanation} />
                  </div>
                </div>
              )}

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
