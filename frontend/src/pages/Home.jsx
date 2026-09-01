import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useBranding } from '../context/BrandingContext';
import { useAuth } from '../context/AuthContext';
import CourseThumbnailCard from '../components/courses/CourseThumbnailCard';
import logoImg from '../assets/logo.png';
import pencilIcon from '../assets/pencil-icon.png';
import posterBanner from '../assets/poster-banner.png';
import results2024 from '../assets/results-2024.png';
import results2025 from '../assets/results-2025.jpg';
import teacherBooks from '../assets/teacher-books.jpg';
import teacherHero from '../assets/teacher-hero.jpg';
import { 
  BookOpen, 
  Sparkles, 
  GraduationCap, 
  Award, 
  CheckCircle2, 
  ArrowRight, 
  PlayCircle, 
  FileText, 
  Clock, 
  Star,
  Users,
  ShieldCheck,
  ChevronDown,
  Flame,
  Check,
  X,
  Youtube,
  Facebook,
  Instagram,
  Calendar,
  FileCheck,
  ThumbsUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Home({ onOpenAuthModal }) {
  const { branding } = useBranding();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [studentAttempts, setStudentAttempts] = useState([]);
  const [enrolledCount, setEnrolledCount] = useState(0);

  const bannerSlides = [
    { src: results2025, alt: 'Maths Result 2025' },
    { src: results2024, alt: 'Maths Result 2024' },
    { src: posterBanner, alt: 'Maths Coaching' }
  ];

  // Interactive Sample MCQ State for Landing Page
  const [sampleSelected, setSampleSelected] = useState(null);
  const [sampleSubmitted, setSampleSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Exclusively 6 Reference Course Examples requested by user
  const initialCourseExamples = [
    {
      id: 'c-abhyaas-11',
      title: 'ABHYAAS Class 11 (26-27)',
      category: 'Class 11 Mathematics',
      code: 'ABHYAAS 26-27',
      description: 'Class 11 Higher Mathematics MCQs Test Series & Chapterwise Formula Handbooks',
      price: 500,
      originalPrice: 1199,
      freeContentCount: 1,
      likesCount: 24,
      grade: 'Class 11'
    },
    {
      id: 'c-abhyaas-8',
      title: 'ABHYAAS Class 8 (26-27)',
      category: 'Class 8 Mathematics',
      code: 'ABHYAAS 26-27',
      description: 'Rational Numbers, Linear Equations & Quadrilaterals Board Practice Series',
      price: 350,
      originalPrice: 799,
      freeContentCount: 1,
      likesCount: 19,
      grade: 'Class 8'
    },
    {
      id: 'c-abhyaas-9',
      title: 'ABHYAAS Class 9 (26-27)',
      category: 'Class 9 Mathematics',
      code: 'ABHYAAS 26-27',
      description: 'Polynomials, Coordinate Geometry & Linear Equations Mastery Series',
      price: 400,
      originalPrice: 899,
      freeContentCount: 1,
      likesCount: 22,
      grade: 'Class 9'
    },
    {
      id: 'c-abhyaas-10',
      title: 'ABHYAAS Class 10 (26-27)',
      category: 'Class 10 Mathematics',
      code: 'ABHYAAS 26-27',
      description: 'Class 10 Board Exam MCQs, Real Numbers & Trigonometry Practice Series',
      price: 450,
      originalPrice: 999,
      freeContentCount: 1,
      likesCount: 31,
      grade: 'Class 10'
    },
    {
      id: 'c-abhyaas-12',
      title: 'ABHYAAS Class 12 (26-27)',
      category: 'Class 12 Mathematics',
      code: 'ABHYAAS 26-27',
      description: 'Calculus, Vectors & 3D Geometry Board Exam Mastery Series',
      price: 550,
      originalPrice: 1299,
      freeContentCount: 1,
      likesCount: 28,
      grade: 'Class 12'
    },
    {
      id: 'c-abhyaas-7',
      title: 'ABHYAAS Class 7 (26-27)',
      category: 'Class 7 Mathematics',
      code: 'ABHYAAS 26-27',
      description: 'Integers, Fractions, Decimals & Algebraic Expressions Foundation',
      price: 300,
      originalPrice: 699,
      freeContentCount: 1,
      likesCount: 16,
      grade: 'Class 7'
    }
  ];

  const [publicPortals, setPublicPortals] = useState([]);
  const [banners, setBanners] = useState(() => {
    try {
      const storedCustom = JSON.parse(localStorage.getItem('sd_custom_banners') || '[]');
      if (Array.isArray(storedCustom) && storedCustom.length > 0) return storedCustom;
    } catch (e) {}
    return [
      { id: 'b1', title: 'CBSE Board 2025 Top Scorers', description: 'Congratulations to our Class 10 & 12 Board Exam Toppers!', thumbnail: results2025, link: '/courses', buttonText: 'Explore Courses' },
      { id: 'b2', title: 'ABHYAAS Mathematics Test Series', description: 'Interactive chapterwise MCQs with instant step-by-step solutions.', thumbnail: posterBanner, link: '/free-resources', buttonText: 'Start Free Practice' }
    ];
  });

  useEffect(() => {
    fetchInitialData();
    try {
      const results = JSON.parse(localStorage.getItem('sd_test_results') || '[]');
      setStudentAttempts(results);

      const enrolled = JSON.parse(localStorage.getItem('sd_enrolled_courses') || '[]');
      setEnrolledCount(enrolled.length);
    } catch (e) {}

    if (user) {
      axios.get('/api/tests/my-attempts').then(res => {
        if (res.data && res.data.success && Array.isArray(res.data.attempts)) {
          setStudentAttempts(res.data.attempts);
        }
      }).catch(() => {});
    }
  }, [user]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      let loadedCourses = [];

      try {
        const [freeRes, coursesRes, portalsRes] = await Promise.all([
          axios.get('/api/free-resources', { timeout: 8000 }),
          axios.get('/api/courses', { timeout: 8000 }),
          axios.get('/api/public-portals', { timeout: 8000 })
        ]);
        if (freeRes.data && freeRes.data.success) {
          setAnnouncements(freeRes.data.announcements);
        }
        if (coursesRes.data && coursesRes.data.success && Array.isArray(coursesRes.data.courses)) {
          loadedCourses = coursesRes.data.courses;
        }
        
        let remotePortals = [];
        if (portalsRes && portalsRes.data && portalsRes.data.success) {
          remotePortals = Array.isArray(portalsRes.data) ? portalsRes.data : (portalsRes.data.portals || []);
          setPublicPortals(remotePortals);
        }
        
        try {
          const storedCustomBanners = JSON.parse(localStorage.getItem('sd_custom_banners') || '[]');
          const mergedBanners = [...storedCustomBanners, ...remotePortals];
          if (mergedBanners.length > 0) {
            const uniqueBanners = Array.from(new Map(mergedBanners.map(b => [b.id || b.title, b])).values());
            setBanners(uniqueBanners);
          }
        } catch (e) {}
      } catch (err) {
        console.warn('Backend API home request failed or timed out, loading local references...', err);
      }

      // Merge stored custom courses created by Admin
      try {
        const storedCustomCourses = JSON.parse(localStorage.getItem('sd_custom_courses') || '[]');
        if (storedCustomCourses.length > 0) {
          const merged = [...storedCustomCourses, ...loadedCourses, ...initialCourseExamples];
          const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
          setCourses(unique);
          return;
        }
      } catch (e) {}

      setCourses(loadedCourses.length > 0 ? loadedCourses : initialCourseExamples);
    } catch (err) {
      console.error('Failed to load initial data, fallback to reference:', err);
      setCourses(initialCourseExamples);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const sampleQuestion = {
    text: "If two positive integers a and b are written as a = x³y² and b = xy³, where x, y are prime numbers, then HCF(a, b) is:",
    options: [
      { key: 'A', text: 'xy' },
      { key: 'B', text: 'xy²' },
      { key: 'C', text: 'x³y³' },
      { key: 'D', text: 'x²y²' }
    ],
    correct: 'B',
    explanation: "HCF is the product of the smallest power of each common prime factor. Smallest power of x is x¹, smallest power of y is y². Therefore, HCF(a, b) = xy²."
  };

  const faqs = [
    {
      q: "How will I access the course video lectures and notes after payment?",
      a: "As soon as your payment is verified by our server-side gateway, your course automatically unlocks under the 'My Enrolled Courses' tab immediately. You get 24/7 access to all videos, PDFs, and practice tests."
    },
    {
      q: "What payment methods are accepted for buying courses?",
      a: "We support all major Indian payment options: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, NetBanking, and Wallets through secure server verification."
    },
    {
      q: "Are the chapterwise MCQ practice tests timed?",
      a: "Yes! Every MCQ test features a live countdown timer, interactive question grid palette, negative marking options, and instant automated evaluation with step-by-step solutions by Manika Ma'am."
    }
  ];

  const displayCourses = courses.length > 0 ? courses : initialCourseExamples;
  const filterCategories = ['All Batches', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

  const filteredCourses = displayCourses.filter(course => {
    if (activeCategory === 'All Batches' || activeCategory === 'ALL') return true;
    const courseCat = (course.category || course.grade || '').toUpperCase();
    const courseTitle = (course.title || '').toUpperCase();
    const activeCatUpper = activeCategory.toUpperCase();
    return courseCat.includes(activeCatUpper) || courseTitle.includes(activeCatUpper);
  });

  return (
    <div className="space-y-10 pb-24">
      
      {/* Top Floating Announcement / Latest Update Bar */}
      {announcements.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500/90 via-amber-500/85 to-[#0284C7]/90 text-white py-1.5 sm:py-2 px-4 sm:px-6 lg:px-10 xl:px-12 border-b border-white/10 shadow-2xs group transition-colors">
          <div className="w-full mx-auto flex items-center justify-between gap-4 text-xs font-extrabold">
            <div className="flex items-center gap-2.5 min-w-0 overflow-hidden flex-1">
              <span className="bg-white/95 text-orange-600 text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 shadow-2xs border border-orange-100/60">
                LATEST UPDATE
              </span>
              
              <div 
                className="overflow-hidden whitespace-nowrap min-w-0 flex-1 relative"
                title={`${announcements[0].title}: ${announcements[0].message}`}
              >
                <div className="truncate">
                  <span className="text-white text-xs font-bold tracking-tight">
                    <strong className="text-amber-100 font-black mr-1.5">{announcements[0].title}:</strong>
                    <span>{announcements[0].message}</span>
                  </span>
                </div>
              </div>
            </div>

            <Link 
              to="/free-resources" 
              className="text-white hover:text-amber-100 hover:underline shrink-0 hidden sm:flex items-center gap-1 font-black text-xs transition-colors"
            >
              <span>View Free Resources</span>
              <span className="text-amber-200">→</span>
            </Link>
          </div>
        </div>
      )}

      {/* ================= 1. PERSONALIZED MATH-THEMED WELCOME BANNER ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-purple-800 shadow-2xl relative overflow-hidden math-grid-pattern">
          
          {/* Decorative Floating Math Symbols Watermark */}
          <div className="absolute right-6 top-4 opacity-15 text-white pointer-events-none select-none font-serif text-6xl font-black space-x-6 hidden sm:block animate-float-math">
            <span>∑</span>
            <span>∫</span>
            <span>π</span>
            <span>√x</span>
            <span>Δ</span>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-amber-400 text-slate-950 border border-amber-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 font-mono shadow-md">
                  <span>∑ STUDENT MATHEMATICS DASHBOARD</span>
                </span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                  🔥 5 Days Math Streak
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Welcome back, {user?.name || 'Monisha'} 👋
              </h1>
              <p className="text-sm sm:text-base font-bold text-slate-300">
                Classes 6–12 Board & Higher Mathematics • Interactive Concept & MCQs Practice
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/courses"
                className="px-6 py-3.5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs shadow-lg transition-all active:scale-95 flex items-center gap-2 border border-sky-400/30"
              >
                <BookOpen className="w-4 h-4" />
                <span>My Enrolled Courses</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. LATEST BANNERS & ACADEMY ANNOUNCEMENTS ================= */}
      {(() => {
        const activeBanners = banners.filter(b => {
          if (b.status && b.status !== 'PUBLISHED') return false;
          const now = new Date();
          if (b.startDate) {
            const start = new Date(b.startDate);
            if (!isNaN(start.getTime()) && now < start) return false;
          }
          if (b.endDate) {
            const end = new Date(b.endDate);
            if (!isNaN(end.getTime()) && now > end) return false;
          }
          return true;
        });

        if (activeBanners.length === 0) return null;

        const currentActiveIndex = activeSlide % activeBanners.length;

        return (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>OFFICIAL ANNOUNCEMENTS</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                  📢 Latest Banners & Academy Highlights
                </h2>
              </div>
              <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 hidden sm:inline-block">
                Auto-rotating active banners ({activeBanners.length})
              </span>
            </div>

            {/* High-Visibility Banner Container (Matching User Screenshot 2: Clean Sky-Blue Split Card with Full Crisp Image Display on Right) */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl border-2 border-sky-200 dark:border-slate-800 bg-[#E0F2FE] dark:bg-slate-900 group">
              {activeBanners.map((b, idx) => {
                const isActive = idx === currentActiveIndex;
                const imageSrc = b.thumbnail || b.src || posterBanner;

                return (
                  <div
                    key={b.id || idx}
                    className={`transition-all duration-700 ease-in-out ${
                      isActive ? 'block opacity-100 scale-100' : 'hidden opacity-0 scale-95'
                    }`}
                  >
                    <div className="relative min-h-[260px] sm:min-h-[300px] flex flex-col md:flex-row items-center justify-between p-6 sm:p-10 gap-6 bg-gradient-to-r from-[#E0F2FE] via-[#F0F9FF] to-[#E0F2FE] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                      
                      {/* Left Side: Badge, Title, Description & Action Button */}
                      <div className="relative z-10 max-w-xl space-y-4 text-left w-full md:w-7/12">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#03458C] text-white text-xs font-black uppercase tracking-wider shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>✦ FEATURED BANNER</span>
                          </span>

                          {b.isFeatured && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/40 text-xs font-black">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>Featured Highlight</span>
                            </span>
                          )}

                          {b.endDate && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 text-[11px] font-black">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Limited Period</span>
                            </span>
                          )}
                        </div>

                        {/* Title - Bold Dark Text */}
                        <h3 className="text-2xl sm:text-4xl font-black text-[#0C2340] dark:text-white tracking-tight leading-tight">
                          {b.title}
                        </h3>
                        
                        {/* Description - Crisp Readable Dark Text */}
                        <p className="text-xs sm:text-base font-extrabold text-[#2D4356] dark:text-slate-300 leading-relaxed line-clamp-3">
                          {b.description}
                        </p>

                        {/* Action Button */}
                        <div className="pt-2">
                          <Link
                            to={b.link || '/courses'}
                            className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-[#03458C] hover:bg-[#023166] text-white font-black text-xs shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                          >
                            <span>{b.buttonText || 'Explore Now'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>

                      {/* Right Side: FULL CRISP UPLOADED IMAGE DISPLAY (Zero dark overlay, 100% visible) */}
                      <div className="w-full md:w-5/12 flex items-center justify-center p-2 relative z-10 shrink-0">
                        <img
                          src={imageSrc}
                          alt={b.title || 'Banner Graphic'}
                          className="max-h-56 sm:max-h-64 w-auto max-w-full object-contain rounded-2xl shadow-md border-2 border-white/60 dark:border-slate-700 bg-white"
                          onError={(e) => { e.target.src = posterBanner; }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Side Navigation Circular White Arrow Buttons (< and >) */}
              {activeBanners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white hover:bg-slate-100 text-[#0C2340] border border-slate-200 flex items-center justify-center transition-all shadow-lg cursor-pointer group-hover:scale-105"
                  >
                    <ChevronLeft className="w-6 h-6 stroke-[3]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSlide((prev) => (prev + 1) % activeBanners.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white hover:bg-slate-100 text-[#0C2340] border border-slate-200 flex items-center justify-center transition-all shadow-lg cursor-pointer group-hover:scale-105"
                  >
                    <ChevronRight className="w-6 h-6 stroke-[3]" />
                  </button>
                </>
              )}

              {/* Centered Dots Pagination Bar at Bottom */}
              {activeBanners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-md">
                  {activeBanners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`h-2.5 rounded-full transition-all cursor-pointer ${
                        i === currentActiveIndex
                          ? 'bg-[#03458C] dark:bg-sky-400 w-7'
                          : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 w-2.5'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* ================= 2. CONTINUE LEARNING & YOUR MATH PROGRESS GRID ================= */}
      {(() => {
        const totalSolved = studentAttempts.length;
        const avgAccuracy = totalSolved > 0 
          ? Math.round(studentAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / totalSolved) 
          : 0;
        const latestAttempt = studentAttempts.length > 0 ? studentAttempts[0] : null;

        const customTests = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
        const freeTests = JSON.parse(localStorage.getItem('sd_free_tests') || '[]');
        const courseQuizzes = JSON.parse(localStorage.getItem('sd_course_quizzes') || '[]');
        const allAdminQuizzes = [...customTests, ...freeTests, ...courseQuizzes];
        const featuredQuiz = allAdminQuizzes.length > 0 ? allAdminQuizzes[0] : null;

        return (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* REAL STUDENT QUIZ ATTEMPT & PROGRESS CARD (Lg: col-span-7) */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-6 flex flex-col justify-between math-grid-pattern">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className="text-xs font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
                        {latestAttempt ? 'RECENT QUIZ ATTEMPT' : 'AVAILABLE PRACTICE QUIZ'}
                      </span>
                    </div>
                    <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                      latestAttempt 
                        ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800'
                        : 'text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 border-sky-300 dark:border-sky-800'
                    }`}>
                      {latestAttempt ? (latestAttempt.passed !== false ? 'PASSED ✅' : 'COMPLETED') : 'READY TO ATTEMPT'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider font-mono">
                      {latestAttempt ? `SCORE: ${latestAttempt.score} / ${latestAttempt.totalMarks || 4} MARKS` : 'MATHEMATICS MCQS BANK'}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      {latestAttempt ? latestAttempt.testTitle : (featuredQuiz?.title || 'Class 10 Mathematics Chapterwise Test')}
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                      {latestAttempt 
                        ? `Attempted by student with ${latestAttempt.percentage || 0}% score. ${latestAttempt.correctCount || 0} correct answers out of ${latestAttempt.totalMarks || 4} total marks.`
                        : 'Chapterwise practice tests created by Manika Ma\'am to test your concepts and track your live performance.'}
                    </p>
                  </div>

                  {/* Dynamic Progress Bar */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-black text-slate-800 dark:text-slate-200">
                      <span>Quiz Score Performance</span>
                      <span className="text-[#0284C7] dark:text-sky-400 font-mono">
                        {latestAttempt ? `${latestAttempt.percentage || 0}% Scored` : '0% Completed — Not Attempted Yet'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-[#0284C7] via-sky-400 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-xs"
                        style={{ width: `${latestAttempt ? Math.min(100, Math.max(5, latestAttempt.percentage || 0)) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-400">
                    <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>{latestAttempt ? `Last Attempted: ${latestAttempt.timeTakenSeconds ? Math.round(latestAttempt.timeTakenSeconds/60) + ' min' : 'Recently'}` : 'Duration: 30 Mins'}</span>
                  </div>
                  
                  {latestAttempt ? (
                    <Link 
                      to={`/test-result/${latestAttempt.id}`}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
                    >
                      <span>View Full Scorecard</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <Link 
                      to={featuredQuiz ? `/test/${featuredQuiz.id}` : '/free-resources'}
                      className="px-6 py-3 rounded-xl bg-[#0284C7] hover:bg-sky-600 text-white font-black text-xs shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
                    >
                      <span>Attempt Quiz Now</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>

              {/* DYNAMIC MATHEMATICS PROGRESS METRICS GRID (Lg: col-span-5) */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-6 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>Mathematics Progress Metrics</span>
                  </h3>
                  <span className="text-xs font-black text-purple-700 dark:text-purple-400 font-mono uppercase">∑ REAL STATS</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Stat 1: Courses Enrolled */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-mono">∫ ENROLLED</span>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      {enrolledCount > 0 ? `${enrolledCount} Batches` : (user ? '1 Batch' : '0 Batches')}
                    </div>
                    <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 block">Enrolled Courses</span>
                  </div>

                  {/* Stat 2: Tests Completed */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-mono">∑ QUIZZES</span>
                    <div className="text-2xl sm:text-3xl font-black text-[#0284C7] dark:text-sky-400">
                      {totalSolved} Solved
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">Attempted Tests</span>
                  </div>

                  {/* Stat 3: Average Accuracy */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-mono">π ACCURACY</span>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
                      {avgAccuracy}% Avg
                    </div>
                    <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 block">Overall Score</span>
                  </div>

                  {/* Stat 4: Total Questions Solved */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-mono">Δ TOTAL MCQS</span>
                    <div className="text-2xl sm:text-3xl font-black text-amber-500 flex items-center gap-1">
                      <span>{studentAttempts.reduce((acc, a) => acc + (a.correctCount || 0) + (a.wrongCount || 0), 0)}</span>
                      <span className="text-xl">Qs</span>
                    </div>
                    <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 block">Attempted MCQs</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link 
                    to="/free-resources" 
                    className="w-full py-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-black text-xs text-center block transition-colors shadow-sm"
                  >
                    View Full Mathematics Scorecard →
                  </Link>
                </div>
              </div>

            </div>
          </section>
        );
      })()}

      {/* ================= 3. UPCOMING / RECOMMENDED BATCHES & TESTS ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-[#0284C7]">ENROLLED & RECOMMENDED</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Upcoming & Recommended Batches
            </h2>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto text-xs font-black pb-1">
            {['All Batches', 'Class 10', 'Class 9', 'Class 11', 'Class 12'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2.5 rounded-xl transition-all ${
                  activeCategory === cat
                    ? 'bg-[#0284C7] text-white shadow-sm font-black'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredCourses.slice(0, 3).map((course) => (
            <CourseThumbnailCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* DYNAMIC PUBLIC PORTALS / FEATURED WEBSITES (PUBLISHED BY ADMIN) */}
      {publicPortals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#0284C7]" /> Dynamic Learning Portals & Features
            </h2>
            <span className="text-xs font-black text-[#0284C7] bg-sky-50 dark:bg-sky-950 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
              Live Updates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicPortals.map(portal => (
              <div key={portal.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-800 shadow-md space-y-4 hover:shadow-xl transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-300 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                    Official Feature
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{portal.title}</h3>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 line-clamp-3">
                    {portal.description}
                  </p>
                </div>

                <Link
                  to={portal.link || '/store'}
                  className="w-full py-3 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs text-center shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>{portal.buttonText || 'Explore Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FILTER COURSES QUICK ACCESS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Quick Batch Filter</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Live Schedule Card */}
          <div 
            onClick={() => setShowScheduleModal(true)}
            className="bg-gradient-to-br from-[#795548] to-[#5D4037] text-white p-6 sm:p-8 rounded-3xl shadow-md border border-amber-900 flex items-center justify-between cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all group"
          >
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-white leading-tight">Live<br />Schedule</h3>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="w-20 h-20 rounded-2xl bg-white/10 p-3 flex items-center justify-center shrink-0">
              <BookOpen className="w-12 h-12 text-amber-200" />
            </div>
          </div>

          {/* Test Series Card */}
          <Link 
            to="/free-resources"
            className="bg-gradient-to-br from-[#1976D2] to-[#1565C0] text-white p-6 sm:p-8 rounded-3xl shadow-md border border-sky-800 flex items-center justify-between cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all group"
          >
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-white leading-tight">Test<br />Series</h3>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="w-20 h-20 rounded-2xl bg-white/10 p-3 flex items-center justify-center shrink-0">
              <FileCheck className="w-12 h-12 text-sky-200" />
            </div>
          </Link>

        </div>
      </section>

      {/* STAY CONNECTED SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Stay Connected</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* 1. YouTube Social Card */}
          <a 
            href="https://www.youtube.com/@sarvottamdiksha5807" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-red-400 dark:hover:border-red-500 transition-all duration-300 flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.498 6.186a2.994 2.994 0 0 0-2.107-2.117C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.391.523A2.994 2.994 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a2.994 2.994 0 0 0 2.107 2.117c1.886.523 9.391.523 9.391.523s7.505 0 9.391-.523a2.994 2.994 0 0 0 2.107-2.117C24 15.93 24 12 24 12s0-3.93-.502-5.814Z" fill="#FF0000"/>
                <path d="m9.545 15.568 6.273-3.568-6.273-3.568v7.136Z" fill="#FFFFFF"/>
              </svg>
            </div>
            <div className="space-y-0.5 text-left">
              <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                YouTube
              </h3>
              <p className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
                Watch free mathematics lessons
              </p>
            </div>
          </a>

          {/* 2. Instagram Social Card */}
          <a 
            href="https://www.instagram.com/sarvottam_diksha_manika" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-pink-400 dark:hover:border-pink-500 transition-all duration-300 flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 dark:from-purple-500/20 dark:via-pink-500/20 dark:to-orange-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Instagram className="w-6 h-6" />
            </div>
            <div className="space-y-0.5 text-left">
              <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                Instagram
              </h3>
              <p className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
                Follow @sarvottam_diksha_manika
              </p>
            </div>
          </a>

          {/* 3. Facebook Social Card */}
          <a 
            href="https://www.facebook.com/Sarvottamdiksha" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-[#1877F2] dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Facebook className="w-6 h-6 fill-current" />
            </div>
            <div className="space-y-0.5 text-left">
              <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-[#1877F2] dark:group-hover:text-blue-400 transition-colors">
                Facebook
              </h3>
              <p className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
                Follow Sarvottam Diksha updates
              </p>
            </div>
          </a>

        </div>
      </section>

      {/* MATHEMATICS COURSE BATCHES CATALOG SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">
              <GraduationCap className="w-4 h-4" />
              <span>Official Sarvottam Diksha Store</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              MATHEMATICS COURSE BATCHES
            </h2>
          </div>

          {/* Filter Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 text-xs font-black">
            {filterCategories.map(cat => {
              const isSelected = activeCategory === cat || (cat === 'All Batches' && activeCategory === 'ALL');
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat === 'All Batches' ? 'ALL' : cat)}
                  className={`px-4 py-2.5 rounded-xl transition-all duration-200 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md font-black scale-105'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 font-extrabold'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Column Responsive Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredCourses.map(course => (
            <div 
              key={course.id}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-orange-400 dark:hover:border-orange-500 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* 1. Custom Branded Thumbnail (NO dark opacity overlay in Dark Mode) */}
                <div className="relative overflow-hidden group-hover:scale-[1.03] transition-transform duration-500">
                  <CourseThumbnailCard 
                    title={course.title}
                    category={course.category}
                    code={course.code}
                    grade={course.grade}
                    thumbnail={course.thumbnail}
                  />
                </div>

                {/* 2. Middle Content Stage */}
                <div className="p-5 space-y-3">
                  
                  {/* Class Badge & Free Content Indicator */}
                  <div className="flex items-center justify-between text-[11px] font-black">
                    <span className="bg-sky-100 dark:bg-sky-950 text-[#0284C7] dark:text-sky-400 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                      {course.category || course.grade}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-1 font-extrabold">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        {course.freeContentCount || 1} Free Content Inside
                      </span>
                    </div>
                  </div>

                  {/* Course Title */}
                  <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug">
                    {course.title}
                  </h3>

                  {/* Short Description */}
                  <p className="text-xs font-extrabold text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Likes Count */}
                  {course.likesCount && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 pt-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-orange-500" />
                      <span>{course.likesCount} Students Liked</span>
                    </div>
                  )}

                </div>
              </div>

              {/* 3. Bottom Row: Price & View & Enroll Button */}
              <div className="px-5 pb-5 pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">₹{course.price}</span>
                  {course.originalPrice && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 line-through ml-2 font-bold">₹{course.originalPrice}</span>
                  )}
                </div>

                <button
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-[#0284C7] hover:bg-[#0369A1] transition-all shadow-md active:scale-95 flex items-center gap-1.5 group-hover:bg-orange-500"
                >
                  <span>View & Enroll →</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* Live Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Weekly Live Batch Schedule
              </h3>
              <button onClick={() => setShowScheduleModal(false)}><X className="w-5 h-5 text-slate-500 dark:text-slate-400" /></button>
            </div>
            
            <div className="space-y-3 text-xs font-bold text-slate-800 dark:text-slate-200">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-800">
                <span className="font-black text-amber-900 dark:text-amber-300 block">Class 10 Board Mathematics</span>
                <span>Sundays @ 10:00 AM • Weekly Timed MCQ Practice</span>
              </div>
              <div className="p-3 bg-sky-50 dark:bg-sky-950/60 rounded-xl border border-sky-200 dark:border-sky-800">
                <span className="font-black text-[#0284C7] dark:text-sky-400 block">Class 11 & 12 Higher Mathematics</span>
                <span>Saturdays @ 6:00 PM • Formula Handbooks & Doubts Discussion</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
