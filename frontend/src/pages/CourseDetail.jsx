import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import RazorpayModal from '../components/payment/RazorpayModal';
import { getCourseThumbnailSrc, getCourseThemeColor, getClassThumbnail } from '../utils/courseHelpers';
import { 
  List, 
  PlayCircle, 
  Bookmark, 
  ThumbsUp, 
  Share2, 
  HelpCircle, 
  MapPin, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Lock, 
  Unlock,
  AlertCircle,
  Tag,
  CreditCard,
  Sparkles,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export default function CourseDetail({ onOpenAuthModal, isAdminPreview = false }) {
  const { id, courseId } = useParams();
  const targetId = courseId || id;
  const { user } = useAuth();
  const navigate = useNavigate();

  const defaultPresets = [
    { id: 'c1', title: 'Class 10 Mathematics Complete NCERT Coaching', price: 650, category: 'CLASS 10 MATHEMATICS', status: 'PUBLISHED', description: 'Class 10 Mathematics Complete NCERT Coaching', chapters: [] },
    { id: 'c2', title: 'Class 10 Mathematics Coaching Batch', price: 1000, category: 'CLASS 10 MATHEMATICS', status: 'PUBLISHED', description: 'Class 10 Mathematics Coaching Batch', chapters: [] },
    { id: 'c3', title: 'Class 9 Mathematics Coaching Batch', price: 500, category: 'CLASS 9 MATHEMATICS', status: 'PUBLISHED', description: 'Class 9 Mathematics Coaching Batch', chapters: [] },
    { id: 'c4', title: 'Class 10 Mathematics Batch', price: 500, category: 'CLASS 10 MATHEMATICS', status: 'PUBLISHED', description: 'Class 10 Mathematics Batch', chapters: [] },
    { id: 'EFGH', title: 'Class 10 Mathematics Complete NCERT Coaching', price: 650, category: 'CLASS 10 MATHEMATICS', status: 'PUBLISHED', description: 'Class 10 Mathematics Complete NCERT Coaching', chapters: [] },
    { id: 'abcd', title: 'Class 10 Mathematics Coaching Batch', price: 1000, category: 'CLASS 10 MATHEMATICS', status: 'PUBLISHED', description: 'Class 10 Mathematics Coaching Batch', chapters: [] },
    { id: 'Abhyaas', title: 'Class 9 Mathematics Coaching Batch', price: 500, category: 'CLASS 9 MATHEMATICS', status: 'PUBLISHED', description: 'Class 9 Mathematics Coaching Batch', chapters: [] },
    { id: 'Abhyaas class 10', title: 'Class 10 Mathematics Batch', price: 500, category: 'CLASS 10 MATHEMATICS', status: 'PUBLISHED', description: 'Class 10 Mathematics Batch', chapters: [] }
  ];

  const findCourseMatch = (targetId, sources) => {
    if (!targetId) return null;
    const normTarget = String(targetId).trim().toLowerCase();
    const found = sources.find(c => {
      if (!c) return false;
      const cId = String(c.id || '').trim().toLowerCase();
      const cTitle = String(c.title || '').trim().toLowerCase();
      return cId === normTarget || cTitle === normTarget || normTarget.includes(cId) || cId.includes(normTarget);
    });

    if (found) return found;

    return {
      id: targetId,
      title: String(targetId).replace(/[-_]/g, ' ').toUpperCase() + ' Batch',
      price: 500,
      category: 'MATHEMATICS',
      status: 'PUBLISHED',
      description: 'Complete NCERT & Board Exam Coaching Batch',
      chapters: []
    };
  };

  const [course, setCourse] = useState(() => {
    try {
      const storedCustom = JSON.parse(localStorage.getItem('sd_custom_courses') || '[]');
      const storedCourses = JSON.parse(localStorage.getItem('sd_courses') || '[]');
      const allLocal = [...storedCustom, ...storedCourses, ...defaultPresets];
      return findCourseMatch(targetId, allLocal);
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(!course);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, content, saved
  const [selectedState, setSelectedState] = useState('Karnataka');
  const [changingState, setChangingState] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [razorpayOpen, setRazorpayOpen] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [likes, setLikes] = useState(3);
  const [liked, setLiked] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [attachedQuizzes, setAttachedQuizzes] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCourseDetail();
  }, [targetId, user]);

  const fetchCourseDetail = async () => {
    if (!course) setLoading(true);
    setNotFound(false);
    let loadedCourse = null;

    try {
      const res = await axios.get(`/api/courses/${targetId}`);
      if (res.data && res.data.success && res.data.course) {
        loadedCourse = res.data.course;
      }
    } catch (err) {}

    if (!loadedCourse) {
      try {
        const res = await axios.get(`/api/admin/courses/${targetId}/full`);
        if (res.data && res.data.success && res.data.course) {
          loadedCourse = res.data.course;
        }
      } catch (err) {}
    }

    if (!loadedCourse) {
      try {
        const storedCustom = JSON.parse(localStorage.getItem('sd_custom_courses') || '[]');
        const storedCourses = JSON.parse(localStorage.getItem('sd_courses') || '[]');
        const allLocal = [...storedCustom, ...storedCourses];
        loadedCourse = allLocal.find(c => String(c.id) === String(targetId) || String(c.title).toLowerCase().trim() === String(targetId).toLowerCase().trim());
      } catch (e) {}
    }

    if (loadedCourse) {
      setCourse(loadedCourse);
      setLikes(loadedCourse.likesCount || 3);
      fetchAvailableCoupons(loadedCourse);
      loadAttachedQuizzes(loadedCourse);
    } else {
      setCourse(null);
      setNotFound(true);
    }

    if (loadedCourse) {
      try {
        const enrolledStored = JSON.parse(localStorage.getItem('sd_enrolled_courses') || '[]');
        const isLocalEnrolled = enrolledStored.includes(targetId) || enrolledStored.includes(loadedCourse.id) || (user && user.role === 'ADMIN');
        let found = false;
        if (user) {
          const myRes = await axios.get('/api/courses/my-courses').catch(() => ({ data: { success: false } }));
          if (myRes.data && myRes.data.success) {
            found = myRes.data.myCourses.some(mc => String(mc.course.id) === String(targetId));
          }
        }
        setIsPurchased(found || isLocalEnrolled);
      } catch (e) {}
    }

    setLoading(false);
  };

  const fetchAvailableCoupons = (currentCourse) => {
    try {
      let allCoupons = [];
      try {
        const storedCoupons = JSON.parse(localStorage.getItem('sd_coupons') || '[]');
        allCoupons = [...storedCoupons];
      } catch (e) {}

      const currentId = String(currentCourse?.id || targetId || '').trim().toLowerCase();
      const currentTitle = String(currentCourse?.title || '').trim().toLowerCase();

      const eligible = allCoupons.filter(c => {
        if (!c || !c.code) return false;
        
        if (!c.courseSelectionType || c.courseSelectionType === 'ALL') return true;

        if (c.courseSelectionType === 'SPECIFIC') {
          const assignedIds = Array.isArray(c.assignedCourseIds) 
            ? c.assignedCourseIds.map(x => String(x).trim().toLowerCase()) 
            : [];
          
          const assignedTitle = String(c.assignedCourseTitle || c.courseTitle || '').trim().toLowerCase();

          const matchesId = assignedIds.some(aid => aid === currentId || currentId.includes(aid) || aid.includes(currentId));
          const matchesTitle = assignedTitle && (assignedTitle === currentTitle || currentTitle.includes(assignedTitle) || assignedTitle.includes(currentTitle));

          return matchesId || matchesTitle || assignedIds.length === 0;
        }

        return true;
      });

      const uniqueMap = new Map();
      eligible.forEach(c => {
        if (!uniqueMap.has(c.code.toUpperCase())) {
          uniqueMap.set(c.code.toUpperCase(), c);
        }
      });

      setAvailableCoupons(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('Failed to filter eligible coupons:', err);
    }
  };

  const loadAttachedQuizzes = (currentCourse) => {
    if (!currentCourse) return;
    const cId = String(currentCourse.id || targetId || '').trim().toLowerCase();
    const cTitle = String(currentCourse.title || '').trim().toLowerCase();

    let collected = [];

    // 1. Direct course properties
    if (Array.isArray(currentCourse.attachedQuizzes)) {
      collected = [...collected, ...currentCourse.attachedQuizzes];
    }
    if (Array.isArray(currentCourse.courseQuizzes)) {
      collected = [...collected, ...currentCourse.courseQuizzes.map(cq => cq.test || cq)];
    }
    if (Array.isArray(currentCourse.quizzes)) {
      collected = [...collected, ...currentCourse.quizzes];
    }
    if (Array.isArray(currentCourse.chapters)) {
      currentCourse.chapters.forEach(ch => {
        if (Array.isArray(ch.quizzes)) collected = [...collected, ...ch.quizzes];
        if (Array.isArray(ch.tests)) collected = [...collected, ...ch.tests];
      });
    }

    // 2. Local Storage course-specific and global mappings
    try {
      const courseQuizzesKey = `sd_course_quizzes_${cId}`;
      const cSpecificQuizzes = JSON.parse(localStorage.getItem(courseQuizzesKey) || '[]');
      if (Array.isArray(cSpecificQuizzes)) {
        collected = [...collected, ...cSpecificQuizzes];
      }

      const globalCourseQuizzes = JSON.parse(localStorage.getItem('sd_course_quizzes') || '[]');
      if (Array.isArray(globalCourseQuizzes)) {
        const matchingGlobal = globalCourseQuizzes.filter(q => 
          String(q.courseId || '').trim().toLowerCase() === cId ||
          (Array.isArray(q.courseIds) && q.courseIds.map(x => String(x).trim().toLowerCase()).includes(cId))
        );
        collected = [...collected, ...matchingGlobal];
      }

      const custom = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
      const free = JSON.parse(localStorage.getItem('sd_free_tests') || '[]');
      const allLocalTests = [...custom, ...free];

      allLocalTests.forEach(t => {
        if (!t) return;
        const tId = String(t.courseId || '').trim().toLowerCase();
        const tTitle = String(t.courseTitle || '').trim().toLowerCase();
        const tAssigned = Array.isArray(t.assignedCourseIds) 
          ? t.assignedCourseIds.map(x => String(x).trim().toLowerCase()) 
          : [];
        const tCourseIds = Array.isArray(t.courseIds)
          ? t.courseIds.map(x => String(x).trim().toLowerCase())
          : [];

        const isMatch = (tId && (tId === cId || cId.includes(tId) || tId.includes(cId))) ||
                        (tTitle && (tTitle === cTitle || cTitle.includes(tTitle))) ||
                        tAssigned.includes(cId) ||
                        tCourseIds.includes(cId);

        if (isMatch) {
          collected.push(t);
        }
      });
    } catch (e) {}

    const uniqueMap = new Map();
    collected.forEach(t => {
      if (t && (t.id || t.title)) {
        const key = String(t.id || t.title).toLowerCase();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, t);
        }
      }
    });

    setAttachedQuizzes(Array.from(uniqueMap.values()));
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter a coupon code.' });
      return;
    }

    const codeUpper = couponCode.trim().toUpperCase();
    let foundCoupon = null;

    try {
      const storedCoupons = JSON.parse(localStorage.getItem('sd_coupons') || '[]');
      foundCoupon = storedCoupons.find(c => c.code?.toUpperCase() === codeUpper);
    } catch (e) {}

    if (!foundCoupon) {
      setCouponApplied(false);
      setDiscount(0);
      setMessage({ type: 'error', text: `Invalid or expired coupon code '${codeUpper}'.` });
      return;
    }

    if (foundCoupon.courseSelectionType === 'SPECIFIC' && foundCoupon.assignedCourseIds) {
      const isEligible = foundCoupon.assignedCourseIds.some(cid => 
        String(cid) === String(id) || (course && (String(cid) === String(course.id) || String(cid) === String(course.title)))
      );
      if (!isEligible) {
        setCouponApplied(false);
        setDiscount(0);
        setMessage({ type: 'error', text: `Coupon '${codeUpper}' is not eligible for this specific course batch.` });
        return;
      }
    }

    const currentPrice = Number(course?.price || 500);
    let discountAmt = 0;
    if (foundCoupon.discountType === 'PERCENTAGE') {
      discountAmt = Math.round((currentPrice * Number(foundCoupon.discountValue || 0)) / 100);
    } else {
      discountAmt = Number(foundCoupon.discountValue || 0);
    }

    setCouponApplied(true);
    setDiscount(discountAmt);
    setMessage({ type: 'success', text: `🎉 Coupon '${codeUpper}' applied! Saved ₹${discountAmt}.` });
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setDiscount(0);
    setCouponCode('');
    setMessage({ type: 'success', text: 'Coupon code removed.' });
  };

  const handleOpenPayment = () => {
    if (!user) {
      onOpenAuthModal();
      return;
    }
    setRazorpayOpen(true);
  };

  const handlePaymentSuccess = async (paymentDetails) => {
    setRazorpayOpen(false);
    try {
      const res = await axios.post('/api/payments/verify', {
        courseId: id,
        orderId: paymentDetails.orderId,
        paymentId: paymentDetails.paymentId,
        signature: paymentDetails.signature,
        couponCode: couponApplied ? couponCode : null
      });

      if (res.data.success) {
        setIsPurchased(true);
        setMessage({ type: 'success', text: 'Payment successful! Course unlocked.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Payment verification failed.' });
    }
  };

  const handleToggleLike = () => {
    if (liked) {
      setLikes(prev => prev - 1);
      setLiked(false);
    } else {
      setLikes(prev => prev + 1);
      setLiked(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm font-black tracking-wide text-slate-300 animate-pulse">Loading Course Student Preview...</div>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-900 border-2 border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-rose-500/10 border-2 border-rose-500/30 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Course not found</h2>
            <p className="text-xs font-bold text-slate-400">
              The requested course ID <span className="font-mono text-rose-400">"{targetId}"</span> could not be found or has been removed.
            </p>
          </div>
          <button 
            onClick={() => navigate('/admin')} 
            className="w-full py-3 bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white rounded-xl font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Bookmark className="w-4 h-4" />
            <span>← Back to Course Catalog</span>
          </button>
        </div>
      </div>
    );
  }

  const coursePrice = course.price || 499;
  const gstAmount = course.gstAmount || 27;
  const handlingFee = course.handlingFee || 14;
  const platformFee = course.platformFee || 10;
  const totalAmountPayable = Math.max(0, coursePrice + gstAmount + handlingFee + platformFee - discount);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1E293B] text-slate-800 dark:text-slate-100 pb-16 transition-colors">
      
      {/* Razorpay Gateway Modal Overlay */}
      <RazorpayModal
        isOpen={razorpayOpen}
        onClose={() => setRazorpayOpen(false)}
        amount={totalAmountPayable}
        courseTitle={course.title}
        user={user}
        onSuccess={handlePaymentSuccess}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Course Overview Header & Coupon Code Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Breadcrumbs, Overview, Coupon Code */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Title & Category Breadcrumb */}
            <div className="space-y-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {course.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{course.title}</h1>
              
              <div className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 px-3 py-1 rounded-md text-xs font-black border border-amber-200 dark:border-amber-800">
                <Tag className="w-3.5 h-3.5" />
                <span>OFFICIAL COURSE</span>
              </div>
            </div>

            {/* Overview / Content Tabs */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-3">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`text-sm font-black pb-2 transition-all ${
                    activeTab === 'overview' 
                      ? 'text-[#0284C7] dark:text-sky-400 border-b-4 border-[#0284C7] dark:border-sky-400' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  OVERVIEW
                </button>

                <button
                  onClick={() => setActiveTab('content')}
                  className={`text-sm font-black pb-2 transition-all ${
                    activeTab === 'content' 
                      ? 'text-[#0284C7] dark:text-sky-400 border-b-4 border-[#0284C7] dark:border-sky-400' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  CONTENT
                </button>
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* About Course Details */}
                  <div className="space-y-3">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">About This Course</h3>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {course.description}
                    </p>
                  </div>

                  {/* Course Expiry & Learning Material Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <Clock className="w-8 h-8 text-slate-500 dark:text-slate-400 shrink-0" />
                      <div>
                        <span className="text-sm font-black text-slate-900 dark:text-white block">
                          Expiring on {new Date(Date.now() + (Number(course.validityDays || 365)) * 86400000).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                          Course access valid for {course.validityDays || 365} days
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PlayCircle className="w-8 h-8 text-[#0284C7] dark:text-sky-400 shrink-0" />
                        <div>
                          <span className="text-sm font-black text-slate-900 dark:text-white block">Learning Materials</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">Chapter Video Lectures & MCQs</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>

                  {/* Included MCQ Quizzes & Test Series Section in OVERVIEW */}
                  {attachedQuizzes.length > 0 && (
                    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-orange-50/90 via-amber-50/50 to-emerald-50/30 dark:from-slate-800 dark:to-slate-800/90 border-2 border-orange-200/80 dark:border-slate-700 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            <span>Included MCQ Practice Tests & Quizzes ({attachedQuizzes.length})</span>
                          </h3>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                            Included with this course batch — Preview details below (unlocks upon course enrollment)
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {attachedQuizzes.map(t => {
                          const isCoursePaid = Number(course?.price || 0) > 0;
                          const isFree = (t.accessMode === 'FREE' || Number(t.price || 0) === 0) && !isCoursePaid;
                          const canAttempt = isPurchased || user?.role === 'ADMIN' || isFree;
                          const qCount = Array.isArray(t.questions) ? t.questions.length : (t.questionCount || 15);
                          const duration = t.durationMinutes || t.duration || 30;
                          const marks = t.totalMarks || t.marks || (qCount * 4);

                          return (
                            <div key={t.id || t.title} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-orange-100 dark:border-slate-800 shadow-xs space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                                  {t.title}
                                </div>
                                {canAttempt ? (
                                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full shrink-0">
                                    ✓ Unlocked
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                    <Lock className="w-3 h-3" />
                                    <span>Locked</span>
                                  </span>
                                )}
                              </div>

                              {/* Quiz Meta Badges */}
                              <div className="flex items-center gap-2 flex-wrap text-[11px] font-extrabold text-slate-600 dark:text-slate-400">
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                  📝 {qCount} Questions
                                </span>
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                  ⏱ {duration} Mins
                                </span>
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                  🎯 {marks} Marks
                                </span>
                              </div>

                              {/* Action Button */}
                              <div className="pt-1">
                                {canAttempt ? (
                                  <button
                                    onClick={() => navigate(`/test/${t.id}`)}
                                    className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <span>Attempt Quiz Now</span>
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenPayment()}
                                    className="w-full py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-300 font-extrabold text-xs rounded-xl border border-amber-200 dark:border-amber-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                    <span>Locked (Buy Course to Attempt)</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Course Curriculum, Lectures & MCQ Test Series
                      </h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                        Access video lectures, handwritten notes, and chapterwise test practice
                      </p>
                    </div>
                    <span className="text-xs font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                      {course.chapters?.length || 0} Chapters
                    </span>
                  </div>

                  {/* Attached Course Quizzes / Global Test Series in CONTENT TAB */}
                  {attachedQuizzes.length > 0 && (
                    <div className="p-5 rounded-3xl bg-gradient-to-r from-sky-50 to-blue-50/50 dark:from-slate-800 dark:to-slate-800/80 border-2 border-sky-200/80 dark:border-slate-700 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-sky-900 dark:text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-sky-600" />
                          <span>Official Included Test Series ({attachedQuizzes.length})</span>
                        </span>
                      </div>

                      <div className="space-y-3">
                        {attachedQuizzes.map(t => {
                          const isCoursePaid = Number(course?.price || 0) > 0;
                          const isFree = (t.accessMode === 'FREE' || Number(t.price || 0) === 0) && !isCoursePaid;
                          const canStart = isPurchased || user?.role === 'ADMIN' || isFree;
                          const qCount = Array.isArray(t.questions) ? t.questions.length : (t.questionCount || 15);
                          const duration = t.durationMinutes || t.duration || 30;
                          const marks = t.totalMarks || t.marks || (qCount * 4);

                          return (
                            <div key={t.id || t.title} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-sky-100 dark:border-slate-700 shadow-xs gap-3">
                              <div className="space-y-1">
                                <div className="text-slate-900 dark:text-white font-black text-sm">{t.title}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold flex items-center gap-2 sm:gap-3 flex-wrap">
                                  <span>📝 {qCount} Questions</span>
                                  <span>⏱ {duration} Mins</span>
                                  <span>🎯 {marks} Marks</span>
                                  <span className={canStart ? "text-emerald-600 font-black" : "text-amber-600 font-black flex items-center gap-1"}>
                                    {canStart ? '🎓 Unlocked' : '🔒 Locked (Requires Course Payment)'}
                                  </span>
                                </div>
                              </div>

                              {canStart ? (
                                <button
                                  onClick={() => navigate(`/test/${t.id}`)}
                                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md cursor-pointer transition-all hover:scale-105"
                                >
                                  START TEST NOW →
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenPayment()}
                                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 cursor-pointer"
                                >
                                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                  <span>Locked (Buy Course to Attempt)</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Chapter-wise Curriculum breakdown */}
                  <div className="space-y-4">
                    {course.chapters && course.chapters.length > 0 ? (
                      course.chapters.map((ch, idx) => (
                        <div key={ch.id || idx} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                          
                          {/* Chapter Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-black text-xs flex items-center justify-center border border-sky-200 dark:border-sky-800">
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white">{ch.title}</h4>
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                  {ch.description || 'Curriculum Chapter'}
                                </span>
                              </div>
                            </div>

                            {ch.duration && (
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                {ch.duration}
                              </span>
                            )}
                          </div>

                          {/* Chapter Content Items */}
                          {ch.videoUrl && (
                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-extrabold">
                              <div className="flex items-center gap-3">
                                <PlayCircle className="w-5 h-5 text-sky-500 shrink-0" />
                                <span className="text-slate-900 dark:text-white font-black">{ch.title} - Video Lecture</span>
                              </div>

                              {isPurchased || user?.role === 'ADMIN' ? (
                                <button
                                  onClick={() => navigate(`/learn/${course.id}`)}
                                  className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-[11px] shadow-xs cursor-pointer"
                                >
                                  WATCH LECTURE
                                </button>
                              ) : (
                                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                  <Lock className="w-3.5 h-3.5" /> Locked
                                </span>
                              )}
                            </div>
                          )}

                          {ch.pdfUrl && (
                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-extrabold">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-amber-500 shrink-0" />
                                <span className="text-slate-900 dark:text-white font-black">{ch.title} - Notes & Study Material</span>
                              </div>

                              {isPurchased || user?.role === 'ADMIN' ? (
                                <button
                                  onClick={() => window.open(ch.pdfUrl, '_blank')}
                                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] shadow-xs cursor-pointer"
                                >
                                  VIEW PDF
                                </button>
                              ) : (
                                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                  <Lock className="w-3.5 h-3.5" /> Locked
                                </span>
                              )}
                            </div>
                          )}

                        </div>
                      ))
                    ) : (
                      <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center space-y-2">
                        <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                        <div className="text-sm font-black text-slate-900 dark:text-white">No chapters added yet</div>
                        <p className="text-xs text-slate-500 font-extrabold">The course instructor has not added curriculum chapters for this course batch yet.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Coupon Code Box */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between font-black text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                <span>You Pay</span>
                <span className="text-lg text-emerald-700 dark:text-emerald-400 font-black">₹ {totalAmountPayable}</span>
              </div>

              {/* Available Public Offers List */}
              {availableCoupons.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-sky-500 inline" />
                    <span>Available Offers & Coupons ({availableCoupons.length})</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {availableCoupons.map(ac => {
                      const isCurrentlyApplied = couponApplied && couponCode.toUpperCase() === ac.code.toUpperCase();
                      const isSpecific = ac.courseSelectionType === 'SPECIFIC';

                      return (
                        <div 
                          key={ac.id} 
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs shadow-2xs ${
                            isCurrentlyApplied 
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700' 
                              : 'bg-gradient-to-r from-sky-50 to-blue-50/50 dark:from-slate-800 dark:to-slate-800/80 border-sky-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 rounded-lg border border-sky-300 dark:border-sky-800 text-[11px]">
                                {ac.code}
                              </span>
                              <span className="font-extrabold text-slate-900 dark:text-white">
                                {ac.discountType === 'PERCENTAGE' ? `${ac.discountValue}% OFF` : `Flat ₹${ac.discountValue} OFF`}
                              </span>
                              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                                ✓ Eligible on this course
                              </span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {ac.title || 'Special Discount Offer'} • {ac.expiresAt ? `Valid till ${new Date(ac.expiresAt).toLocaleDateString()}` : 'Lifetime Unlimited Validity'}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setCouponCode(ac.code);
                              const currentPrice = Number(course?.price || 500);
                              let discountAmt = 0;
                              if (ac.discountType === 'PERCENTAGE') {
                                discountAmt = Math.round((currentPrice * Number(ac.discountValue || 0)) / 100);
                              } else {
                                discountAmt = Number(ac.discountValue || 0);
                              }
                              setCouponApplied(true);
                              setDiscount(discountAmt);
                              setMessage({ type: 'success', text: `🎉 Coupon '${ac.code}' applied! Saved ₹${discountAmt}.` });
                            }}
                            className={`px-3.5 py-1.5 font-black text-[11px] rounded-xl shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer ${
                              isCurrentlyApplied 
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                : 'bg-gradient-to-r from-sky-500 to-[#0284C7] hover:from-sky-600 hover:to-sky-700 text-white'
                            }`}
                          >
                            {isCurrentlyApplied ? '✓ APPLIED' : 'Apply Coupon'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Coupon Input Box & Active Coupon Status */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500 text-white font-black"><Tag className="w-5 h-5" /></div>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      {couponApplied ? `Applied Coupon: ${couponCode.toUpperCase()}` : 'Have a custom coupon code?'}
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">
                      {couponApplied ? `Saving ₹${discount} on this course!` : 'Type any private or secret coupon code below.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {couponApplied ? (
                    <button
                      onClick={handleRemoveCoupon}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shrink-0 shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      Remove Coupon
                    </button>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="e.g. WELCOME500"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white font-black text-xs uppercase focus:outline-none"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shrink-0 shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        Apply here
                      </button>
                    </>
                  )}
                </div>
              </div>

              {message.text && (
                <div className={`p-3 rounded-xl text-xs font-black flex items-center gap-2 ${
                  message.type === 'success' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{message.text}</span>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Course Card & Checkout Widget */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Course Card Widget */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-center">
              
              {/* Image Banner */}
              <div 
                className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center"
                style={{ backgroundColor: getCourseThemeColor(course) }}
              >
                <img 
                  src={getCourseThumbnailSrc(course)} 
                  alt="" 
                  onError={(e) => {
                    const fallback = getClassThumbnail(course.title, course.category, course.grade);
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = fallback;
                    }
                  }}
                  className="w-full h-48 object-contain" 
                />
                <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-1 rounded-md shadow-xs">
                  <img src={logoImg} alt="Sarvottam Diksha" className="h-6 w-auto" />
                </div>
              </div>

              <div className="text-left space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{course.title}</h3>
                <div className="text-2xl font-black text-slate-900 dark:text-white pt-1">₹ {totalAmountPayable}</div>
              </div>

              {/* Get This Course / Buy Now / Free Unlock Button */}
              {isPurchased ? (
                <button
                  onClick={() => navigate('/my-courses')}
                  className="w-full py-4 rounded-2xl font-black text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Course Unlocked — Access Content</span>
                </button>
              ) : (Number(course.price) === 0 || course.isFree) ? (
                <button
                  onClick={() => {
                    try {
                      const enrolled = JSON.parse(localStorage.getItem('sd_enrolled_courses') || '[]');
                      const updatedEnrolled = Array.from(new Set([...enrolled, targetId, course.id]));
                      localStorage.setItem('sd_enrolled_courses', JSON.stringify(updatedEnrolled));

                      setIsPurchased(true);
                      setMessage({ type: 'success', text: '🎉 Free course unlocked successfully! You can now access all contents and quizzes.' });
                      axios.post(`/api/courses/${course.id}/enroll`).catch(() => {});
                    } catch (e) {}
                  }}
                  className="w-full py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Unlock Free Course</span>
                </button>
              ) : (
                <button
                  onClick={handleOpenPayment}
                  className="w-full py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Buy Now – ₹ {totalAmountPayable}</span>
                </button>
              )}

            </div>

            {/* Checkout Price Details & Doubts Support Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              
              {/* Doubts Support Widget */}
              <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">Have doubts regarding this course ?</h4>
                    <Link to="/chats" className="text-xs font-black text-[#0284C7] dark:text-sky-400 hover:underline">
                      Talk to Tutor
                    </Link>
                  </div>
                </div>
              </div>

              {/* Price Breakup */}
              <div className="space-y-2 text-xs font-extrabold text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span>Course Price</span>
                  <span>₹ {coursePrice}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>GST (18%)</span>
                  <span>+ ₹ {gstAmount}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Handling Fee</span>
                  <span>+ ₹ {handlingFee}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Coupon Discount</span>
                    <span>- ₹ {discount}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-black text-slate-900 dark:text-white">
                  <span>Total Amount</span>
                  <span>₹ {totalAmountPayable}</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
