import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import RazorpayModal from '../components/payment/RazorpayModal';
import { FileText, Award, Clock, ArrowRight, Lock, CheckCircle2, ShoppingBag } from 'lucide-react';

export default function FreeResources() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState({
    freeTests: [],
    purchasedTests: [],
    courseTests: [],
    lockedPaidTests: []
  });
  const [activeCategoryTab, setActiveCategoryTab] = useState('FREE'); // FREE, PURCHASED, COURSE, LOCKED
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuizForPayment, setSelectedQuizForPayment] = useState(null);
  const [razorpayOpen, setRazorpayOpen] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      let remoteCatalog = { freeTests: [], purchasedTests: [], courseTests: [], lockedPaidTests: [] };

      try {
        const [catRes, freeRes] = await Promise.all([
          axios.get('/api/tests/catalog/categorized', { timeout: 8000 }),
          axios.get('/api/free-resources', { timeout: 8000 })
        ]);

        if (catRes.data && catRes.data.success) {
          remoteCatalog = catRes.data.catalog;
        }
        if (freeRes.data && freeRes.data.success) {
          setResources(freeRes.data.resources || []);
        }
      } catch (err) {
        console.warn('Backend API catalog request failed or timed out, loading custom published tests...', err);
      }

      // Merge locally published custom tests from Admin Workspace (sd_custom_tests, sd_test_portal_tests, sd_free_tests)
      try {
        const storedCustomTests = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
        const testPortalTests = JSON.parse(localStorage.getItem('sd_test_portal_tests') || '[]');
        const storedFreeTests = JSON.parse(localStorage.getItem('sd_free_tests') || '[]');
        const allAdminTests = [...storedCustomTests, ...testPortalTests, ...storedFreeTests];

        const localFreeTests = allAdminTests.filter(t => 
          t.accessMode === 'FREE' || 
          t.isFreeTest === true || 
          t.isFree === true ||
          (Number(t.price) === 0 && t.accessMode !== 'PAID' && t.accessMode !== 'COURSE_ONLY')
        ).map(t => ({
          ...t,
          accessMode: 'FREE',
          isUnlocked: true,
          accessReason: 'FREE_TEST',
          durationMinutes: t.durationMinutes || t.duration || 60,
          totalMarks: t.totalMarks || 100,
          questionCount: t.questionCount || (t.questions ? t.questions.length : 10)
        }));

        if (localFreeTests.length > 0) {
          const mergedFree = [...localFreeTests, ...(remoteCatalog.freeTests || [])];
          const uniqueFree = Array.from(new Map(mergedFree.map(item => [item.id, item])).values());
          remoteCatalog = {
            ...remoteCatalog,
            freeTests: uniqueFree
          };
        }
      } catch (e) {}

      setCatalog(remoteCatalog);
    } catch (err) {
      console.error('Failed to load test catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyQuiz = (test) => {
    setSelectedQuizForPayment(test);
    setRazorpayOpen(true);
  };

  const handleQuizPaymentSuccess = async (paymentDetails) => {
    if (!selectedQuizForPayment) return;
    try {
      const res = await axios.post('/api/payments/verify-quiz-payment', {
        testId: selectedQuizForPayment.id,
        paymentId: paymentDetails.paymentId,
        orderId: paymentDetails.orderId,
        signature: paymentDetails.signature
      });

      if (res.data.success) {
        setRazorpayOpen(false);
        setMessage({ type: 'success', text: `🎉 Standalone Test "${selectedQuizForPayment.title}" unlocked successfully!` });
        await fetchData();
        navigate(`/test/${selectedQuizForPayment.id}`);
      }
    } catch (err) {
      console.error('Quiz Payment Error:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Payment verification failed.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-xs font-black text-amber-800 dark:text-amber-300">
          <Award className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <span>Test Series & Practice Examination Portal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Practice Tests & Question Bank</h1>
        <p className="text-sm sm:text-base font-extrabold text-slate-700 dark:text-slate-300">
          Attempt free quizzes, standalone paid test series, or tests included in your enrolled courses.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl text-xs font-black text-center ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
          {message.text}
        </div>
      )}

      {/* 4 Category Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => setActiveCategoryTab('FREE')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeCategoryTab === 'FREE'
              ? 'bg-emerald-600 text-white shadow-md scale-105'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
          }`}
        >
          🎁 FREE TESTS ({catalog.freeTests.length})
        </button>

        <button
          onClick={() => setActiveCategoryTab('PURCHASED')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeCategoryTab === 'PURCHASED'
              ? 'bg-amber-600 text-white shadow-md scale-105'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
          }`}
        >
          💳 PURCHASED TESTS ({catalog.purchasedTests.length})
        </button>

        <button
          onClick={() => setActiveCategoryTab('COURSE')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeCategoryTab === 'COURSE'
              ? 'bg-sky-600 text-white shadow-md scale-105'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-400'
          }`}
        >
          🎓 COURSE INCLUDED ({catalog.courseTests.length})
        </button>

        <button
          onClick={() => setActiveCategoryTab('LOCKED')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeCategoryTab === 'LOCKED'
              ? 'bg-purple-600 text-white shadow-md scale-105'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-400'
          }`}
        >
          🔒 LOCKED / PAID STANDALONE ({catalog.lockedPaidTests.length})
        </button>
      </div>

      {/* Tests Grid */}
      <div className="space-y-4">
        {(() => {
          let list = [];
          if (activeCategoryTab === 'FREE') list = catalog.freeTests;
          else if (activeCategoryTab === 'PURCHASED') list = catalog.purchasedTests;
          else if (activeCategoryTab === 'COURSE') list = catalog.courseTests;
          else if (activeCategoryTab === 'LOCKED') list = catalog.lockedPaidTests;

          if (list.length === 0) {
            return (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-slate-200 dark:border-slate-800 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                No tests found in this category.
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {list.map(t => (
                <div key={t.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-md space-y-4 flex flex-col justify-between hover:shadow-xl transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        {t.accessMode === 'FREE' ? '🎁 Free Access' : t.accessMode === 'PAID' ? `💳 Standalone (₹${t.price})` : '🎓 Course Included'}
                      </span>
                      <span className="text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded font-black flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {t.durationMinutes} Mins
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{t.title}</h3>
                    <p className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
                      Duration: {t.durationMinutes} mins • Marks: {t.totalMarks} • {t.questionCount} Questions
                    </p>
                    {t.attachedCourses && t.attachedCourses.length > 0 && (
                      <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                        Included in: {t.attachedCourses.join(', ')}
                      </div>
                    )}
                  </div>

                  {t.isUnlocked ? (
                    <button
                      onClick={() => navigate(`/test/${t.id}`)}
                      className="w-full py-3.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <span>START TEST NOW</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuyQuiz(t)}
                      className="w-full py-3.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>UNLOCK STANDALONE TEST — ₹{t.price}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Razorpay Test Payment Modal */}
      {razorpayOpen && selectedQuizForPayment && (
        <RazorpayModal
          isOpen={razorpayOpen}
          onClose={() => setRazorpayOpen(false)}
          amount={selectedQuizForPayment.price}
          courseTitle={`Standalone Test: ${selectedQuizForPayment.title}`}
          user={user}
          onSuccess={handleQuizPaymentSuccess}
        />
      )}

      {/* Free Study Notes & Formula Handbooks */}
      <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#0284C7] dark:text-sky-400" /> Printable Formula Sheets & PDF Notes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Class 10 Quadratic Equations Formula Book', type: 'PDF Handbook', size: '2.4 MB' },
            { title: 'Class 9 Polynomials Summary & Identities', type: 'PDF Handbook', size: '1.8 MB' },
            { title: 'Class 10 Trigonometric Ratios & Table', type: 'Formula Sheet', size: '1.2 MB' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between transition-colors">
              <div className="space-y-2">
                <div className="p-3 w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-[#0284C7] dark:text-sky-400 flex items-center justify-center font-black">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-sm">{item.title}</h4>
                <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 block">{item.type} • {item.size}</span>
              </div>

              <button
                onClick={() => alert("Downloading formula sheet PDF...")}
                className="w-full py-3 rounded-xl font-black text-xs text-[#0284C7] dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Download PDF Notes</span>
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
