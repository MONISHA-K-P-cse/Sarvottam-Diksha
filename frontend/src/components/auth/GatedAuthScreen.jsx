import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import logoImg from '../../assets/logo.png';
import logoDarkImg from '../../assets/logo-dark.png';
import pencilIcon from '../../assets/pencil-icon.png';
import posterBanner from '../../assets/poster-banner.png';
import posterFlyer from '../../assets/poster-flyer.png';
import results2023 from '../../assets/results-2023.png';
import results2024 from '../../assets/results-2024.png';
import results2025 from '../../assets/results-2025.jpg';
import teacherHeroCutout from '../../assets/teacher-hero-cutout.png';
import teacherHero from '../../assets/teacher-hero.jpg';
import teacherProblem from '../../assets/teacher-problem.jpg';
import teacherPointing from '../../assets/teacher-pointing-cutout.png';
import teacherBooks from '../../assets/teacher-books.jpg';
import { 
  User, 
  Award,
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  Video, 
  FileCheck2, 
  MessageSquare, 
  Shield,
  Star,
  ChevronRight,
  BookOpen,
  Clock,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  CreditCard,
  Key,
  Flame,
  PieChart,
  Sun,
  Moon,
  MessageCircle,
  BarChart3,
  FileSpreadsheet,
  CheckSquare,
  Bookmark,
  ArrowUp,
  TrendingUp,
  Check,
  Youtube,
  Instagram,
  Facebook,
  Phone,
  MapPin,
  X
} from 'lucide-react';

export default function GatedAuthScreen() {
  const { login, register, resetPassword, confirmPasswordReset } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();

  // Auth State
  const [role, setRole] = useState('STUDENT'); // STUDENT or ADMIN
  const [isRegister, setIsRegister] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resetLinkUrl, setResetLinkUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // Scroll & Header state
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Section 2 Capability Category Filter State
  const [activeCapabilityCategory, setActiveCapabilityCategory] = useState('ALL');

  // Section 6 Formula Tab
  const [formulaTab, setFormulaTab] = useState('Algebra');

  // Section 9 FAQ Open Index
  const [openFaq, setOpenFaq] = useState(null);

  // Section 7.5 Results Gallery State
  const [resultsYear, setResultsYear] = useState('2025');

  // Selected Class Filter State for Course Catalog
  const [selectedClass, setSelectedClass] = useState('ALL');

  // Contact Support Modal State
  const [showContactModal, setShowContactModal] = useState(false);

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setError('');
    setSuccessMessage('');
    setIsForgotPassword(false);
    setEmail('');
    setPassword('');
  };

  const scrollToLoginPortal = (targetMode = 'LOGIN') => {
    if (targetMode === 'REGISTER') {
      setIsRegister(true);
      setRole('STUDENT');
    } else {
      setIsRegister(false);
    }
    setError('');
    const el = document.getElementById('login-portal');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const input = el.querySelector('input[type="email"]') || el.querySelector('input[type="text"]');
        if (input) input.focus();
      }, 400);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const targetEmail = (email || '').trim();
      const targetPassword = password || '';

      if (!targetEmail) {
        throw new Error('Please enter your email address.');
      }
      if (!targetPassword) {
        throw new Error('Please enter your password.');
      }

      let res;
      if (role === 'STUDENT' && isRegister) {
        res = await register(targetEmail, targetPassword, { name: name || 'Student', phone: phone || '' });
      } else {
        res = await login(targetEmail, targetPassword);
      }

      const authenticatedUser = res?.user;
      if (authenticatedUser?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/my-courses');
      }
    } catch (err) {
      console.error('Sign-in Error:', err);
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setError('');
    setSuccessMessage('');
    setIsForgotPassword(true);
  };

  const handleForgotPasswordSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMessage('');
    setResetLinkUrl('');
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your registered email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(cleanEmail);
      setSuccessMessage(res.message || `A password recovery email has been sent to ${cleanEmail}! Please check your inbox.`);
      if (res.resetLink) {
        setResetLinkUrl(res.resetLink);
      }
    } catch (err) {
      setError(err.message || 'Failed to send password recovery email.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoStudent = async () => {
    setLoading(true);
    setError('');
    try {
      await login('monisha@gmail.com', 'student123');
      navigate('/my-courses');
    } catch (err) {
      setError('Student demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAdmin = async () => {
    setLoading(true);
    setError('');
    try {
      await login('dikshasarvottam@gmail.com', 'admin123');
      navigate('/admin');
    } catch (err) {
      setError('Admin demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  // ALL 8 REAL CAPABILITIES OF SARVOTTAM DIKSHA
  const allCapabilities = [
    {
      id: 1,
      category: 'LEARNING',
      title: '1. Learn Visually',
      desc: 'Concept-focused video lessons and printable learning material for Class 7–12 NCERT syllabus.',
      icon: <Video className="w-7 h-7 text-[#0284C7] dark:text-sky-400" />,
      bg: 'bg-sky-50 dark:bg-slate-800 border-sky-200 dark:border-slate-700'
    },
    {
      id: 2,
      category: 'LEARNING',
      title: '2. Practice Smart',
      desc: 'Chapter-wise MCQ practice with instant evaluation so students build strong fundamentals.',
      icon: <BookOpen className="w-7 h-7 text-[#FF6500] dark:text-orange-400" />,
      bg: 'bg-orange-50 dark:bg-slate-800 border-orange-200 dark:border-slate-700'
    },
    {
      id: 3,
      category: 'TESTING',
      title: '3. Test Yourself',
      desc: 'Exam-style timed chapter tests designed for CBSE & State Board exam practice with detailed scorecards.',
      icon: <Clock className="w-7 h-7 text-purple-600 dark:text-purple-400" />,
      bg: 'bg-purple-50 dark:bg-slate-800 border-purple-200 dark:border-slate-700'
    },
    {
      id: 4,
      category: 'WORKSHEETS',
      title: '4. Submit Worksheets',
      desc: 'Upload completed homework and practice worksheets directly for teacher grading.',
      icon: <FileSpreadsheet className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />,
      bg: 'bg-emerald-50 dark:bg-slate-800 border-emerald-200 dark:border-slate-700'
    },
    {
      id: 5,
      category: 'WORKSHEETS',
      title: '5. Get Teacher Feedback',
      desc: 'View teacher corrections, comments, step-by-step grade feedback and reviewed PDFs.',
      icon: <CheckSquare className="w-7 h-7 text-teal-600 dark:text-teal-400" />,
      bg: 'bg-teal-50 dark:bg-slate-800 border-teal-200 dark:border-slate-700'
    },
    {
      id: 6,
      category: 'LEARNING',
      title: '6. Access Solutions',
      desc: 'View teacher-uploaded step-by-step NCERT & Board model solutions and reference handbooks.',
      icon: <Bookmark className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />,
      bg: 'bg-indigo-50 dark:bg-slate-800 border-indigo-200 dark:border-slate-700'
    },
    {
      id: 7,
      category: 'SUPPORT',
      title: '7. Clear Your Doubts',
      desc: 'Get direct 1-on-1 personalized doubt-solving support with Manika Ma\'am whenever a concept gets tough.',
      icon: <MessageCircle className="w-7 h-7 text-amber-600 dark:text-amber-400" />,
      bg: 'bg-amber-50 dark:bg-slate-800 border-amber-200 dark:border-slate-700'
    },
    {
      id: 8,
      category: 'ANALYTICS',
      title: '8. Track Your Progress',
      desc: 'Review test performance, chapter accuracy trends, and identify exact focus areas for improvement.',
      icon: <BarChart3 className="w-7 h-7 text-rose-600 dark:text-rose-400" />,
      bg: 'bg-rose-50 dark:bg-slate-800 border-rose-200 dark:border-slate-700'
    }
  ];

  const filteredCapabilities = activeCapabilityCategory === 'ALL' 
    ? allCapabilities 
    : allCapabilities.filter(c => c.category === activeCapabilityCategory);

  // Formula Hub Data
  const formulaData = {
    Algebra: [
      { name: 'Quadratic Equation Standard Form', formula: 'ax² + bx + c = 0' },
      { name: 'Quadratic Roots Formula', formula: 'x = (-b ± √(b² - 4ac)) / 2a' },
      { name: 'Discriminant', formula: 'Δ = b² - 4ac' },
      { name: 'Algebraic Identity', formula: '(a + b)² = a² + 2ab + b²' }
    ],
    Trigonometry: [
      { name: 'Pythagorean Identity', formula: 'sin²θ + cos²θ = 1' },
      { name: 'Tangent Relation', formula: 'tan θ = sin θ / cos θ' },
      { name: 'Secant Identity', formula: '1 + tan²θ = sec²θ' },
      { name: 'Complementary Angle', formula: 'sin(90° - θ) = cos θ' }
    ],
    Geometry: [
      { name: 'Pythagoras Theorem', formula: 'a² + b² = c²' },
      { name: 'Area of Triangle', formula: 'Area = ½ × base × height' },
      { name: 'Distance Formula', formula: 'd = √((x₂ - x₁)² + (y₂ - y₁)²)' },
      { name: 'Midpoint Formula', formula: '((x₁ + x₂)/2, (y₁ + y₂)/2)' }
    ],
    Calculus: [
      { name: 'Power Rule Differentiation', formula: 'd/dx (xⁿ) = n · xⁿ⁻¹' },
      { name: 'Standard Limit', formula: 'lim (x→0) (sin x / x) = 1' },
      { name: 'Indefinite Integral', formula: '∫ xⁿ dx = (xⁿ⁺¹)/(n+1) + C' }
    ]
  };

  // FAQ Data
  const faqList = [
    {
      q: 'Which classes are covered?',
      a: 'We provide specialized Mathematics programs for Class 7, Class 8, Class 9, Class 10, Class 11, and Class 12.'
    },
    {
      q: 'Is the platform for CBSE and State Board students?',
      a: 'Yes, all course modules, formula handbooks, and MCQ tests align with both CBSE and State Board NCERT patterns.'
    },
    {
      q: 'How do I purchase a course?',
      a: 'Select your batch under Store, click "Buy Now", and complete payment via Razorpay UPI, Cards, or NetBanking.'
    },
    {
      q: 'What happens after I make a payment?',
      a: 'Your course automatically unlocks under "My Enrolled Courses" immediately upon server payment verification.'
    },
    {
      q: 'When is my course unlocked?',
      a: 'Instant access! Videos, PDFs, and practice tests are accessible 24/7 immediately after enrollment.'
    },
    {
      q: 'Are MCQ tests included?',
      a: 'Yes, every batch includes chapter-wise timed MCQ practice tests with automated scorecard analysis.'
    },
    {
      q: 'Can I practise chapter-wise?',
      a: 'Absolutely! Practice questions and test series are organized chapter-by-chapter according to your syllabus.'
    },
    {
      q: 'How can I ask a doubt?',
      a: 'Students can send doubt messages directly to Manika Ma\'am under the "Chats" tab for 1-on-1 clarification.'
    },
    {
      q: 'How do I access my purchased courses?',
      a: 'Simply sign in to your student account and click "My Enrolled Courses" in the top navigation bar.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1E293B] text-[#0F172A] dark:text-slate-100 flex flex-col justify-between relative overflow-x-hidden font-sans selection:bg-[#0284C7] selection:text-white transition-colors duration-300 text-base">
      
      {/* ================= 1. ⭐ SLIM TRANSLUCENT STICKY NAVBAR ================= */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/85 dark:bg-slate-900/85 backdrop-blur-md shadow-md border-b border-slate-200/80 dark:border-slate-800 py-2.5' 
          : 'bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs border-b border-slate-200/50 dark:border-slate-800/50 py-3.5'
      }`}>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 flex items-center justify-between">
          
          {/* Left Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={logoImg} alt="Sarvottam Diksha Logo" className="h-14 sm:h-16 md:h-18 w-auto object-contain select-none dark:hidden block" />
            <img src={logoDarkImg} alt="Sarvottam Diksha Logo" className="h-14 sm:h-16 md:h-18 w-auto object-contain select-none hidden dark:block" />
          </div>

          {/* Center Smooth Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200">
            <a href="#features" className="hover:text-[#0284C7] dark:hover:text-sky-400 transition-colors">Features</a>
            <a href="#courses" className="hover:text-[#0284C7] dark:hover:text-sky-400 transition-colors">Courses</a>
            <a href="#why-diksha" className="hover:text-[#0284C7] dark:hover:text-sky-400 transition-colors">Why Diksha?</a>
            <a href="#mcq-engine" className="hover:text-[#0284C7] dark:hover:text-sky-400 transition-colors">MCQ Engine</a>
            <a href="#formula-hub" className="hover:text-[#0284C7] dark:hover:text-sky-400 transition-colors">Formulas</a>
            <a href="#faq" className="hover:text-[#0284C7] dark:hover:text-sky-400 transition-colors">FAQ</a>
          </nav>

          {/* Right Controls: Theme Segment Pill + Sign In Button */}
          <div className="flex items-center gap-3">
            {/* 2-Segment Control Pill */}
            <div className="flex items-center bg-slate-200/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                  theme === 'light' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                  theme === 'dark' ? 'bg-slate-900 text-amber-400 shadow-xs border border-slate-700' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="hidden sm:inline">Dark</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => scrollToLoginPortal('LOGIN')}
              className="px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 group cursor-pointer"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-white" />
            </button>
          </div>

        </div>
      </header>

      {/* ================= BACKGROUND CANVAS WITH CONTINUOUS SUBTLE MATHEMATICS & PENCIL WATERMARK ================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        
        {/* Continuous Subtle Mathematical Grid Pattern across full height */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 dark:opacity-15"></div>

        {/* VIBRANT AMBIENT LIGHT MODE COLOR ORBS */}
        <div className="absolute top-[120px] -left-32 w-96 h-96 bg-sky-400/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-[480px] -right-32 w-[30rem] h-[30rem] bg-orange-400/15 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-[1000px] left-[15%] w-[32rem] h-[32rem] bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-[1600px] right-[15%] w-[30rem] h-[30rem] bg-purple-400/15 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-[2300px] left-[10%] w-[32rem] h-[32rem] bg-amber-400/15 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* SINGLE LARGE 3D PENCIL WATERMARK (Continuous Brand Watermark) */}
        <div className="absolute top-[450px] left-[34%] sm:left-[30%] md:left-[28%] lg:left-[27%] -translate-y-1/2 -translate-x-1/2 opacity-[0.08] dark:opacity-[0.03] pointer-events-none">
          <img 
            src={pencilIcon} 
            alt="Sarvottam Diksha Background Pencil Watermark" 
            className="w-[480px] sm:w-[580px] lg:w-[680px] h-auto object-contain select-none transform rotate-[6deg]"
          />
        </div>

        {/* ================= CONTINUOUS MATHEMATICS FORMULAS & GEOMETRIC DIAGRAMS (SLIGHTLY DARKER VISIBLE WATERMARKS) ================= */}
        
        {/* --- ZONE 1: HERO SECTION ATMOSPHERIC ACADEMIC MATH ELEMENTS --- */}
        <div className="absolute top-12 left-[12%] text-[#FF6500] font-mono text-xl sm:text-2xl font-black opacity-[0.22] dark:opacity-[0.16]">
          f(x) = ax² + bx + c
        </div>
        <div className="absolute top-28 left-4 text-[#0284C7] font-mono text-lg sm:text-2xl font-black opacity-[0.22] dark:opacity-[0.16]">
          a² + b² = c²
        </div>
        <div className="absolute top-16 right-[8%] text-[#FF6500] font-mono text-base sm:text-xl font-black opacity-[0.22] dark:opacity-[0.16]">
          y = mx + c
        </div>
        <div className="absolute top-44 right-[20%] text-emerald-600 font-mono text-lg sm:text-xl font-black opacity-[0.22] dark:opacity-[0.16]">
          sin²θ + cos²θ = 1
        </div>
        <svg className="absolute top-8 left-2 w-64 h-48 opacity-[0.20] dark:opacity-[0.14] text-[#0284C7] stroke-current fill-none" viewBox="0 0 200 150">
          <line x1="10" y1="130" x2="190" y2="130" strokeWidth="2" />
          <line x1="100" y1="10" x2="100" y2="140" strokeWidth="2" />
          <path d="M 30 20 Q 100 130 170 20" strokeWidth="2.5" />
        </svg>

        {/* --- ZONE 2: EVERYTHING YOU NEED TO MASTER MATHEMATICS --- */}
        <div className="absolute top-[520px] left-[2%] text-amber-600 font-mono text-base font-black opacity-[0.22] dark:opacity-[0.16]">
          Area = ½ × b × h
        </div>
        <div className="absolute top-[680px] right-[3%] text-[#0284C7] font-mono text-lg font-black opacity-[0.22] dark:opacity-[0.16]">
          tan θ = sin θ / cos θ
        </div>
        <div className="absolute top-[920px] left-[3%] text-[#FF6500] font-mono text-xl font-black opacity-[0.22] dark:opacity-[0.16]">
          Δ = b² − 4ac
        </div>
        <div className="absolute top-[1120px] right-[4%] text-emerald-600 font-mono text-lg font-black opacity-[0.22] dark:opacity-[0.16]">
          x = (−b ± √(b² − 4ac)) / (2a)
        </div>
        <svg className="absolute top-[820px] left-[1%] w-48 h-36 opacity-[0.20] dark:opacity-[0.14] text-amber-500 stroke-current fill-none" viewBox="0 0 150 120">
          <polygon points="20,100 130,100 75,20" strokeWidth="2" />
          <path d="M 20,100 A 30,30 0 0,0 45,85" strokeWidth="1.5" />
        </svg>
        <svg className="absolute top-[1020px] right-[2%] w-52 h-52 opacity-[0.20] dark:opacity-[0.14] text-sky-500 stroke-current fill-none" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="45" strokeWidth="2" />
          <line x1="60" y1="60" x2="92" y2="28" strokeWidth="2" />
          <text x="68" y="48" className="text-[10px] font-black fill-current">r</text>
        </svg>

        {/* --- ZONE 3: SELECT YOUR CLASS / COURSE CATALOG --- */}
        <div className="absolute top-[1380px] left-[3%] text-amber-600 font-mono text-base font-black opacity-[0.22] dark:opacity-[0.16]">
          (a + b)² = a² + 2ab + b²
        </div>
        <div className="absolute top-[1520px] right-[3%] text-[#0284C7] font-mono text-base font-black opacity-[0.22] dark:opacity-[0.16]">
          lim (x → 0) (sin x / x) = 1
        </div>
        <div className="absolute top-[1750px] left-[2%] text-emerald-600 font-mono text-base font-black opacity-[0.22] dark:opacity-[0.16]">
          d/dx (xⁿ) = n · xⁿ⁻¹
        </div>
        <div className="absolute top-[1980px] right-[3%] text-[#FF6500] font-mono text-base font-black opacity-[0.22] dark:opacity-[0.16]">
          α + β = −b/a • α · β = c/a
        </div>
        <svg className="absolute top-[1520px] right-[2%] w-64 h-32 opacity-[0.20] dark:opacity-[0.14] text-[#0284C7] stroke-current fill-none" viewBox="0 0 200 100">
          <path d="M 10 50 Q 50 10 100 50 T 190 50" strokeWidth="2.5" />
          <line x1="10" y1="50" x2="190" y2="50" strokeWidth="1.5" strokeDasharray="4 4" />
        </svg>

        {/* --- ZONE 4: HOW IT WORKS / 5-STEP PROGRESSION --- */}
        <div className="absolute top-[2220px] left-[2%] text-emerald-600 font-mono text-xl font-black opacity-[0.22] dark:opacity-[0.16]">
          ∫ xⁿ dx = (xⁿ⁺¹)/(n+1) + C
        </div>
        <div className="absolute top-[2420px] right-[3%] text-amber-600 font-mono text-xl font-black opacity-[0.22] dark:opacity-[0.16]">
          Σ xᵢ / n (Mean)
        </div>
        <div className="absolute top-[2620px] left-[3%] text-[#0284C7] font-mono text-base font-black opacity-[0.22] dark:opacity-[0.16]">
          1 + tan²θ = sec²θ
        </div>
        <svg className="absolute top-[2320px] right-[1%] w-44 h-44 opacity-[0.20] dark:opacity-[0.14] text-emerald-600 stroke-current fill-none" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="45" strokeWidth="2" />
          <line x1="15" y1="60" x2="105" y2="60" strokeWidth="1.5" />
          <line x1="60" y1="15" x2="60" y2="105" strokeWidth="1.5" />
          <line x1="60" y1="60" x2="92" y2="28" strokeWidth="2" />
        </svg>

        {/* --- ZONE 5: OUR BOARD RESULTS --- */}
        <div className="absolute top-[2850px] left-[2%] text-[#FF6500] font-mono text-lg font-black opacity-[0.22] dark:opacity-[0.16]">
          V = ⁴/₃ π r³ • A = π r²
        </div>
        <div className="absolute top-[3050px] right-[3%] text-amber-600 font-mono text-base font-black opacity-[0.22] dark:opacity-[0.16]">
          d = √((x₂ − x₁)² + (y₂ − y₁)²)
        </div>
        <div className="absolute top-[3280px] left-[3%] text-[#0284C7] font-mono text-base font-black opacity-[0.22] dark:opacity-[0.16]">
          sin²θ + cos²θ = 1
        </div>
        <svg className="absolute top-[2920px] left-[1%] w-52 h-40 opacity-[0.20] dark:opacity-[0.14] text-amber-500 stroke-current fill-none" viewBox="0 0 160 120">
          <line x1="20" y1="100" x2="140" y2="20" strokeWidth="2.5" />
          <line x1="20" y1="100" x2="140" y2="100" strokeWidth="1.5" />
          <line x1="140" y1="20" x2="140" y2="100" strokeWidth="1.5" />
        </svg>

        {/* --- ZONE 6: TIMED MCQ PRACTICE ENGINE --- */}
        <div className="absolute top-[3450px] right-[3%] text-[#FF6500] font-mono text-lg font-black opacity-[0.22] dark:opacity-[0.16]">
          (a − b)² = a² − 2ab + b²
        </div>
        <div className="absolute top-[3680px] left-[2%] text-amber-600 font-mono text-base font-black opacity-[0.22] dark:opacity-[0.16]">
          log(a · b) = log a + log b
        </div>
        <div className="absolute top-[3900px] right-[3%] text-emerald-600 font-mono text-base font-black opacity-[0.22] dark:opacity-[0.16]">
          P(A ∪ B) = P(A) + P(B) − P(A ∩ B)
        </div>
        <svg className="absolute top-[3550px] right-[1%] w-56 h-44 opacity-[0.20] dark:opacity-[0.14] text-amber-600 stroke-current fill-none" viewBox="0 0 180 130">
          <line x1="10" y1="110" x2="170" y2="110" strokeWidth="2" />
          <line x1="90" y1="10" x2="90" y2="120" strokeWidth="2" />
          <path d="M 20 10 Q 90 110 160 10" strokeWidth="2.5" />
        </svg>

        {/* --- ZONE 7: ASK MANIKA MA'AM / FORMULA HUB / FAQ / FOOTER --- */}
        <div className="absolute top-[4150px] left-[2%] text-[#FF6500] font-mono text-base font-black opacity-[0.22] dark:opacity-[0.16]">
          1 + cot²θ = cosec²θ
        </div>
        <div className="absolute top-[4380px] right-[3%] text-[#0284C7] font-mono text-lg font-black opacity-[0.22] dark:opacity-[0.16]">
          ∫ xⁿ dx = (xⁿ⁺¹)/(n+1) + C
        </div>
        <div className="absolute top-[4620px] left-[3%] text-amber-600 font-mono text-base font-black opacity-[0.22] dark:opacity-[0.16]">
          f'(x) = lim (h → 0) [f(x+h) − f(x)] / h
        </div>
        <div className="absolute top-[4880px] right-[4%] text-emerald-600 font-mono text-base font-black opacity-[0.22] dark:opacity-[0.16]">
          sin(90° − θ) = cos θ
        </div>

      </div>

      {/* ================= SECTION 1: RESTRUCTURED HERO SECTION ================= */}
      <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center relative z-10 py-10 lg:py-16">
        <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 my-auto space-y-12 lg:space-y-16">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* LEFT HERO CONTENT (Compact Brand Badge → Main Headline → CTAs → Trust Features) */}
            <div className="lg:col-span-6 space-y-6 text-left">
              
              {/* 1. Compact Brand Logo & Tagline (Reduced Gap) */}
              <div className="space-y-2">
                <img 
                  src={logoImg} 
                  alt="Sarvottam Diksha Official Logo" 
                  className="w-[170px] sm:w-[200px] md:w-[220px] h-auto object-contain select-none dark:hidden block"
                />
                <img 
                  src={logoDarkImg} 
                  alt="Sarvottam Diksha Official Logo" 
                  className="w-[170px] sm:w-[200px] md:w-[220px] h-auto object-contain select-none hidden dark:block"
                />
              </div>

              {/* 2. Main Headline & Subtext */}
              <div className="space-y-3.5">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F172A] dark:text-white tracking-tight leading-[1.10]">
                  Understand Mathematics.<br />
                  Don't Just <span className="text-[#0284C7]">Memorise It</span>.
                </h1>

                <p className="text-lg sm:text-xl font-extrabold text-[#FF6500] dark:text-orange-400">
                  Master Concepts with Manika Ma'am
                </p>

                <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg font-semibold max-w-xl leading-relaxed">
                  Build rock-solid fundamentals, practice smart with timed MCQs, and prepare for Class 6–12 board exams with step-by-step clarity.
                </p>
              </div>

              {/* 3. Hero CTAs (Explore Courses & Student Login) */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <a
                  href="#courses"
                  className="px-8 py-4 rounded-2xl bg-[#FF6500] hover:bg-orange-600 text-white font-black text-base shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 group"
                >
                  <span>Explore Courses</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>

                <button
                  type="button"
                  onClick={() => scrollToLoginPortal('LOGIN')}
                  className="px-7 py-4 rounded-2xl bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-750 text-[#0284C7] dark:text-sky-400 border border-sky-200 dark:border-slate-700 font-black text-base transition-all duration-300 flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-5 h-5 text-[#0284C7] dark:text-sky-400" />
                  <span>Student Login</span>
                </button>
              </div>

              {/* 4. Trust & Feature Badges Underneath */}
              <div className="flex flex-wrap items-center gap-5 sm:gap-6 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm font-extrabold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  100% NCERT Pattern
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0284C7] shrink-0" />
                  Timed MCQ Tests
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF6500] shrink-0" />
                  1-on-1 Doubt Support
                </span>
              </div>

            </div>

            {/* RIGHT HERO CONTENT — ENLARGED TEACHER VISUAL ANCHOR (+35% SIZE, DEPTH & 3 FLOATING BADGES) */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[560px] group">
                
                {/* 3 FLOATING TRUST BADGES */}
                {/* Badge 1: Top Left */}
                <div className="absolute -top-4 -left-2 sm:-left-4 z-20 bg-slate-900/95 text-amber-300 text-xs sm:text-sm font-black px-4 py-2 rounded-2xl border border-amber-500/40 shadow-2xl backdrop-blur-md flex items-center gap-2 transform -rotate-2 hover:rotate-0 transition-transform">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>10+ Years Experience</span>
                </div>

                {/* Badge 2: Top Right */}
                <div className="absolute -top-4 -right-2 sm:-right-4 z-20 bg-slate-900/95 text-sky-300 text-xs sm:text-sm font-black px-4 py-2 rounded-2xl border border-sky-500/40 shadow-2xl backdrop-blur-md flex items-center gap-2 transform rotate-2 hover:rotate-0 transition-transform">
                  <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Classes 6–12 (CBSE & ICSE)</span>
                </div>

                {/* Badge 3: Bottom Center */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-orange-500 via-amber-500 to-[#0284C7] text-white text-xs sm:text-sm font-black px-5 py-2.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-2 whitespace-nowrap">
                  <Flame className="w-4 h-4 text-yellow-200 shrink-0" />
                  <span>Concept → Practice → Master</span>
                </div>

                {/* Ambient Layered Brand Glow Behind Photo */}
                <div className="absolute -inset-6 bg-gradient-to-tr from-[#0284C7]/25 via-amber-500/20 to-[#FF6500]/25 rounded-3xl blur-3xl opacity-80 group-hover:opacity-100 transition duration-700"></div>

                {/* Soft-Edged Layered Visual Composition */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-3.5 sm:p-4 border border-slate-800/80 shadow-2xl space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3.2] sm:aspect-[4/3.1]">
                    <img 
                      src={teacherHero} 
                      alt="Manika Ma'am - Founder & Lead Mathematics Educator" 
                      className="w-full h-full object-cover object-[center_12%]"
                    />
                    
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-4 sm:p-5 flex items-end justify-between z-10">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-400/50 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>FOUNDER & LEAD EDUCATOR</span>
                        </span>
                        <div className="text-xl sm:text-2xl font-black text-white">Manika Maheshwari</div>
                        <div className="text-xs font-extrabold text-slate-300">Sarvottam Diksha Mathematics</div>
                      </div>
                      <span className="bg-[#0284C7] text-white text-xs font-black px-3.5 py-1.5 rounded-full border border-sky-400/40 shadow-md shrink-0">
                        Lead Mentor
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* ================= UNIFIED 2-COLUMN SECTION: COACHING (LEFT 45%) & LOGIN PORTAL (RIGHT 55%) ================= */}
          <div id="login-portal" className="pt-8 border-t border-slate-200/80 dark:border-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
              
              {/* LEFT COLUMN (45% Width = lg:col-span-5): PERSONALISED MATHEMATICS COACHING PANEL */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-orange-500 via-amber-500 to-[#0284C7] text-white shadow-xl border border-white/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]"></div>

                <div className="relative z-10 space-y-6 text-left my-auto">
                  <span className="inline-block bg-white/20 text-white text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-white/30">
                    PERSONALISED MATHEMATICS COACHING
                  </span>
                  
                  <div className="space-y-3">
                    <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-snug">
                      Master Mathematics with Manika
                    </h3>
                    <p className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed">
                      Personalised coaching • Concept clarity • Board exam preparation
                    </p>
                  </div>

                  <div className="pt-4">
                    <a
                      href="#courses"
                      className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-black text-sm sm:text-base shadow-2xl transition-all hover:scale-105 active:scale-95 border border-slate-700/80 group/btn"
                    >
                      <span>Explore Coaching</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>

                {/* Bottom Trust Info */}
                <div className="relative z-10 pt-8 border-t border-white/20 flex items-center justify-between text-xs font-extrabold text-amber-100">
                  <span>Class 6–12 Board Success</span>
                  <span>100% NCERT Aligned</span>
                </div>
              </div>

              {/* RIGHT COLUMN (55% Width = lg:col-span-7): STUDENT & ADMIN LOGIN PORTAL PANEL */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                
                {isForgotPassword ? (
                  <div className="space-y-5 animate-fade-in">
                    <div className="text-center space-y-1.5">
                      <span className="text-xs font-black uppercase tracking-widest text-[#0284C7]">ACCOUNT SECURITY PORTAL</span>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">Reset Your Password</h3>
                      <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Enter your registered email and set a new password.
                      </p>
                    </div>

                    {/* Error & Success State Banners */}
                    {error && (
                      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300 text-xs sm:text-sm font-black text-center animate-fade-in shadow-xs">
                        {error}
                      </div>
                    )}

                    {successMessage ? (
                      <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-400 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 text-center space-y-4 animate-fade-in shadow-xs">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto border border-emerald-300 dark:border-emerald-700">
                          <Mail className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-black text-emerald-900 dark:text-emerald-100">Check Your Email</h4>
                          <p className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 leading-relaxed">
                            {successMessage}
                          </p>
                          <p className="text-xs text-emerald-700 dark:text-emerald-400 pt-1">
                            Click the secure link inside the email to set your new password.
                          </p>
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMessage(''); setResetLinkUrl(''); }}
                            className="px-6 py-2.5 rounded-xl font-black text-xs text-white bg-[#0284C7] hover:bg-[#0369A1] shadow-sm transition-all cursor-pointer"
                          >
                            ← Return to Sign In
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-xs sm:text-sm font-bold">
                        <div>
                          <label className="block text-slate-800 dark:text-slate-200 mb-1.5 font-black">
                            Registered Email Address
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              required
                              placeholder="e.g. your_email@gmail.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pl-11 text-slate-900 dark:text-white font-extrabold focus:outline-none focus:border-[#0284C7] focus:bg-white dark:focus:bg-slate-800 transition-all text-sm sm:text-base placeholder-slate-400 dark:placeholder-slate-500"
                            />
                            <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-4 rounded-xl font-black text-sm sm:text-base text-white bg-[#0284C7] hover:bg-[#0369A1] shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
                        >
                          <Mail className="w-5 h-5" />
                          <span>{loading ? 'Sending Recovery Email...' : 'Send Password Reset Email'}</span>
                        </button>

                        <div className="text-center pt-2">
                          <button
                            type="button"
                            onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMessage(''); }}
                            className="text-xs font-black text-slate-600 dark:text-slate-400 hover:text-[#0284C7] dark:hover:text-sky-400 transition-colors cursor-pointer"
                          >
                            ← Return to Sign In
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="text-center space-y-1.5">
                      <span className="text-xs font-black uppercase tracking-widest text-[#0284C7]">STUDENT & ADMIN ACCESS</span>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">Sign In to Your Learning Portal</h3>
                      <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Access your enrolled courses, chapterwise timed MCQ tests, and doubt chats.
                      </p>
                    </div>

                    {/* Role Selection Toggle */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl text-sm font-black">
                      <button
                        type="button"
                        onClick={() => handleRoleChange('STUDENT')}
                        className={`py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                          role === 'STUDENT'
                            ? 'bg-[#0284C7] text-white shadow-md font-black'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span>I am a Student</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRoleChange('ADMIN')}
                        className={`py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                          role === 'ADMIN'
                            ? 'bg-[#0284C7] text-white shadow-md font-black'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>I am Teacher (Admin)</span>
                      </button>
                    </div>

                    {/* Error & Success State Banners */}
                    {error && (
                      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300 text-sm font-black text-center">
                        {error}
                      </div>
                    )}
                    {successMessage && (
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm font-black text-center space-y-2">
                        <div>{successMessage}</div>
                      </div>
                    )}

                    {/* Form Fields */}
                    <form onSubmit={handleSubmit} className="space-y-4 text-sm font-bold">
                      
                      {role === 'STUDENT' && isRegister && (
                        <div>
                          <label className="block text-slate-800 dark:text-slate-200 mb-1.5 font-black">Full Student Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Monisha K P"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-slate-900 dark:text-white font-extrabold focus:outline-none focus:border-[#0284C7] focus:bg-white dark:focus:bg-slate-800 transition-all text-sm sm:text-base"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-slate-800 dark:text-slate-200 mb-1.5 font-black">
                          {role === 'ADMIN' ? 'Admin Email' : 'Email Address'}
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            placeholder={role === 'ADMIN' ? "admin@sarvottamdiksha.com" : "student@gmail.com"}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pl-11 text-slate-900 dark:text-white font-extrabold focus:outline-none focus:border-[#0284C7] focus:bg-white dark:focus:bg-slate-800 transition-all text-sm sm:text-base placeholder-slate-400 dark:placeholder-slate-500"
                          />
                          <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-slate-800 dark:text-slate-200 font-black">
                            {role === 'ADMIN' ? 'Special Admin Passcode' : 'Password'}
                          </label>
                          <button 
                            type="button" 
                            onClick={handleForgotPassword} 
                            className="text-xs font-black text-[#0284C7] dark:text-sky-400 hover:underline cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type="password"
                            required
                            minLength={6}
                            placeholder={isRegister ? "Min 6 characters" : role === 'ADMIN' ? "Enter admin passcode" : "Enter your password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pl-11 text-slate-900 dark:text-white font-extrabold focus:outline-none focus:border-[#0284C7] focus:bg-white dark:focus:bg-slate-800 transition-all text-sm sm:text-base placeholder-slate-400 dark:placeholder-slate-500"
                          />
                          <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-4 rounded-xl font-black text-sm sm:text-base text-white bg-[#0284C7] hover:bg-[#0369A1] shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
                      >
                        <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </form>

                    {/* Demo Login (Testing & Review Access) */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 text-center">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                        TESTING & REVIEW ACCESS
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleQuickDemoStudent}
                          className="py-3 px-3 rounded-xl bg-[#F1F5F9] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-black transition-colors cursor-pointer"
                        >
                          Demo Student
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickDemoAdmin}
                          className="py-3 px-3 rounded-xl bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-900 dark:text-purple-300 text-xs sm:text-sm font-black transition-colors cursor-pointer"
                        >
                          Manika Ma'am (Admin)
                        </button>
                      </div>
                    </div>

                    {/* Registration Link */}
                    {role === 'STUDENT' && (
                      <div className="text-center text-sm font-extrabold text-slate-600 dark:text-slate-400 pt-1">
                        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                          type="button"
                          onClick={() => { setIsRegister(!isRegister); setError(''); }}
                          className="text-[#0284C7] dark:text-sky-400 font-black hover:underline cursor-pointer"
                        >
                          {isRegister ? 'Sign In' : 'Register Here'}
                        </button>
                      </div>
                    )}
                  </>
                )}

              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ================= ITEM 4: 8 CAPABILITIES SHOWCASE WITH PROMINENT NUMBERS (01-08) ================= */}
      <section id="features" className="relative z-10 py-14 lg:py-20 border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xs transition-colors duration-300">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#FF6500]">SARVOTTAM DIKSHA PLATFORM</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] dark:text-white tracking-tight">
                Everything You Need to Master Mathematics
              </h2>
              <p className="text-base sm:text-lg font-semibold text-slate-600 dark:text-slate-400 max-w-xl">
                A structured learning ecosystem designed specifically for Class 6–12 CBSE & Board Exam success.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto text-xs sm:text-sm font-black pb-1">
              {['ALL', 'LEARNING', 'TESTING', 'WORKSHEETS', 'SUPPORT', 'ANALYTICS'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCapabilityCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl transition-all ${
                    activeCapabilityCategory === cat
                      ? 'bg-[#0284C7] text-white shadow-sm font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 8 Capabilities Grid Container with Prominent 01-08 Number Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {filteredCapabilities.map((cap, index) => {
              const numBadge = String(index + 1).padStart(2, '0');
              return (
                <div 
                  key={cap.id}
                  className="bg-gradient-to-br from-white via-white to-sky-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md hover:shadow-2xl hover:border-[#0284C7] dark:hover:border-sky-500 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between space-y-5 group relative overflow-hidden h-full"
                >
                  <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${
                    index % 4 === 0 ? 'from-[#0284C7] to-sky-400' :
                    index % 4 === 1 ? 'from-[#FF6500] to-amber-400' :
                    index % 4 === 2 ? 'from-emerald-500 to-teal-400' :
                    'from-purple-500 to-indigo-400'
                  }`} />
                  <div className="space-y-4">
                    {/* Header Row: Prominent Number Badge & Icon */}
                    <div className="flex justify-between items-center">
                      <span className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-[#0284C7] dark:text-sky-400 font-black text-lg flex items-center justify-center border border-sky-200 dark:border-sky-800">
                        {numBadge}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                        {cap.icon}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-black text-[#0F172A] dark:text-white tracking-tight group-hover:text-[#0284C7] dark:group-hover:text-sky-400 transition-colors">
                      {cap.title.replace(/^\d+\.\s*/, '')}
                    </h3>

                    {/* 1-Line Description */}
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                      {cap.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    {cap.category} MODULE
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ================= ITEM 6: PROBLEM → SOLUTION STORY WITH PHOTO #2 ================= */}
      <section className="relative z-10 py-14 lg:py-20 bg-gradient-to-b from-slate-900 to-slate-950 text-white overflow-hidden border-t border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left: Photo 2 - Teacher with Problem-Solving / Thinking Expression */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group max-w-[380px] w-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-2xl">
                  <img 
                    src={teacherProblem} 
                    alt="Manika Ma'am - Mathematics Problem Solving" 
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 sm:p-5 text-center">
                    <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider mb-1 border border-amber-500/30">
                      MATHEMATICS CHALLENGE
                    </span>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-200">"You don't need more memorisation. You need the concept explained differently."</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Problem → Solution Story + 3 Benefit Cards */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="space-y-4">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400">THE LEARNING GAP</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  Still Struggling to Understand Mathematics?
                </h2>
                <p className="text-base sm:text-lg text-slate-300 font-semibold leading-relaxed">
                  Most students don't hate math — they hate feeling confused. At Sarvottam Diksha, we rebuild your confidence step-by-step:
                </p>
              </div>

              {/* 3 Benefit Cards */}
              <div className="space-y-4">
                <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 space-y-1.5 transition-all">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Visual Concept Proofs</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed pl-7">
                    Deriving every theorem visually step-by-step so you understand the logic behind formulas instead of blindly cramming.
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 rounded-2xl p-5 space-y-1.5 transition-all">
                  <div className="flex items-center gap-2 text-sky-400 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Timed Exam Simulation</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed pl-7">
                    Chapterwise timed MCQ tests that train your speed and accuracy under realistic board exam conditions.
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 space-y-1.5 transition-all">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>1-on-1 Personal Doubts</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed pl-7">
                    Direct personal assistance with Manika Ma'am whenever you get stuck on any step during homework or revision.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= ITEM 7, 8, 9 & 14: COURSES SECTION WITH PHOTO #3 POINTING GESTURE & CARD VARIETY ================= */}
      <section id="courses" className="relative z-10 py-14 lg:py-20 bg-[#F8FAFC]/90 dark:bg-[#1E293B]/90 border-t border-slate-200/80 dark:border-slate-800 transition-colors duration-300 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header Banner featuring Photo #3 Pointing Gesture - HIGH-POP PREMIUM STYLING */}
          <div className="relative bg-gradient-to-r from-sky-950 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white border border-sky-500/30 shadow-2xl shadow-sky-950/60 overflow-hidden group">
            
            {/* Ambient Background Glowing Auras */}
            <div className="absolute -left-20 -top-20 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              {/* Photo 3: Cutout of Teacher Pointing Right with Ambient Aura - PERFECT BALANCED SIZE */}
              <div className="md:col-span-4 flex justify-center md:justify-start">
                <div className="relative max-w-[280px] sm:max-w-[320px] lg:max-w-[350px]">
                  <div className="absolute inset-0 bg-gradient-to-t from-sky-500/30 via-emerald-500/10 to-transparent blur-2xl rounded-full"></div>
                  <img 
                    src={teacherPointing} 
                    alt="Manika Ma'am Pointing to Courses" 
                    className="relative z-10 w-full h-auto object-contain drop-shadow-[0_20px_30px_rgba(2,132,199,0.35)]"
                  />
                </div>
              </div>

              {/* Banner Text directly pointed at by teacher */}
              <div className="md:col-span-8 space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-400/40 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-[#FF6500] shadow-sm">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span>SELECT YOUR CLASS</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  Find Your Class. <span className="bg-gradient-to-r from-sky-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">Start Learning.</span>
                </h2>

                <p className="text-base sm:text-lg font-semibold text-slate-300 max-w-xl leading-relaxed">
                  Select your class below to access concept videos, formula handbooks, and chapterwise timed MCQ test series curated personally by Manika Ma'am.
                </p>

                {/* 3 Quick Highlight Badges */}
                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-sky-300 text-xs font-black flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" /> NCERT & Exemplar
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-amber-300 text-xs font-black flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" /> Timed Board MCQs
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-emerald-300 text-xs font-black flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1-on-1 Doubt Help
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ITEM 14: HIGH-POP GLASSMORPHIC CLASS SELECTOR BAR */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <Sparkles className="w-4 h-4 text-[#FF6500] animate-pulse" />
              <span>Filter Batches by Class</span>
            </div>

            <div className="relative p-2 rounded-full bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl flex items-center justify-center gap-1.5 sm:gap-2.5 overflow-x-auto max-w-full">
              {['ALL', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map((cls) => {
                const isSelected = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`relative px-5 py-3 rounded-full font-black text-xs sm:text-sm transition-all duration-300 shrink-0 cursor-pointer flex items-center gap-2 group ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#FF6500] via-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/40 ring-2 ring-orange-400/60 scale-105'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/50 hover:border-sky-500/50 hover:shadow-md hover:shadow-sky-500/20'
                    }`}
                  >
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    )}
                    <span>{cls === 'ALL' ? 'All Batches' : cls}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ITEM 7 & 8: Wide, Prominent Course Cards filtered dynamically by selectedClass */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {[
              { cls: 'CLASS 6', grade: 'Class 6', type: 'TYPE_A', title: 'Class 6 Maths Mock Series', board: 'CBSE & State Board', features: 'Timed MCQs • Practice Sets • Doubt Help', tag: 'NEW BATCH', theme: 'ORANGE' },
              { cls: 'CLASS 7', grade: 'Class 7', type: 'TYPE_A', title: 'Class 7 Mathematics Basics Batch', board: 'CBSE & State Board', features: 'Concept Videos • Timed MCQs • Worksheets', tag: 'FOUNDATION', theme: 'YELLOW' },
              { cls: 'CLASS 8', grade: 'Class 8', type: 'TYPE_A', title: 'Class 8 Mathematics Foundation', board: 'CBSE & State Board', features: 'Rational Numbers • Equations • Worksheets', tag: 'FOUNDATION', theme: 'GREEN' },
              { cls: 'CLASS 9', grade: 'Class 9', type: 'TYPE_A', title: 'Class 9 Mathematics Mastery', board: 'CBSE & State Board', features: 'Polynomials • Geometry • Test Series', tag: 'MASTERY', theme: 'ORANGE' },
              { cls: 'CLASS 10', grade: 'Class 10', type: 'TYPE_B', title: 'Class 10 ABHYAAS Board Mastery', board: 'CBSE / ICSE Board Exam', features: 'Full Board Syllabus • MCQs • Graded Papers', tag: '★ HIGHLIGHTED BATCH', theme: 'HERO' },
              { cls: 'CLASS 11', grade: 'Class 11', type: 'TYPE_A', title: 'Class 11 Calculus & Sets Mastery', board: 'CBSE Higher Mathematics', features: 'Calculus • Trigonometry • Practice Series', tag: 'ADVANCED', theme: 'YELLOW' },
              { cls: 'CLASS 12', grade: 'Class 12', type: 'TYPE_A', title: 'Class 12 Board Exam Target 100', board: 'CBSE / ICSE Board Exam', features: 'Full NCERT • Timed Test Series • 1-on-1 Doubts', tag: 'TARGET 100', theme: 'GREEN' }
            ]
              .filter(c => selectedClass === 'ALL' || c.grade.toLowerCase() === selectedClass.toLowerCase())
              .map((c, i) => {
                const isHighlighted = c.theme === 'HERO';

                const themeStyles = {
                  ORANGE: {
                    card: 'bg-gradient-to-br from-orange-50/90 via-white to-amber-50/50 dark:from-slate-900/95 dark:via-slate-900 dark:to-orange-950/30 border-orange-200/90 dark:border-orange-500/30 hover:border-orange-400 dark:hover:border-orange-400 shadow-md hover:shadow-2xl',
                    tag: 'bg-orange-100 dark:bg-orange-500/20 text-[#FF6500] dark:text-orange-300 border border-orange-200 dark:border-orange-400/40',
                    features: 'bg-orange-100/60 dark:bg-slate-950/80 text-orange-900 dark:text-orange-200 border border-orange-200/80 dark:border-orange-500/30',
                    cta: 'text-[#FF6500] dark:text-orange-400'
                  },
                  YELLOW: {
                    card: 'bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/50 dark:from-slate-900/95 dark:via-slate-900 dark:to-amber-950/30 border-amber-200/90 dark:border-amber-500/30 hover:border-amber-400 dark:hover:border-amber-400 shadow-md hover:shadow-2xl',
                    tag: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-400/40',
                    features: 'bg-amber-100/60 dark:bg-slate-950/80 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-500/30',
                    cta: 'text-amber-700 dark:text-amber-400'
                  },
                  GREEN: {
                    card: 'bg-gradient-to-br from-emerald-50/90 via-white to-green-50/50 dark:from-slate-900/95 dark:via-slate-900 dark:to-emerald-950/30 border-emerald-200/90 dark:border-emerald-500/30 hover:border-emerald-400 dark:hover:border-emerald-400 shadow-md hover:shadow-2xl',
                    tag: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-400/40',
                    features: 'bg-emerald-100/60 dark:bg-slate-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-500/30',
                    cta: 'text-emerald-700 dark:text-emerald-400'
                  },
                  HERO: {
                    card: 'bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950 text-white border-orange-500/90 shadow-2xl ring-2 ring-orange-500/40',
                    tag: 'bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black shadow-sm',
                    features: 'bg-slate-800/80 text-slate-200 border border-slate-700',
                    cta: 'text-amber-300'
                  }
                }[c.theme];

                return (
                  <div 
                    key={i} 
                    onClick={() => scrollToLoginPortal('LOGIN')}
                    className={`p-8 sm:p-9 rounded-3xl border transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between h-full group relative overflow-hidden ${themeStyles.card}`}
                  >
                  <div className="space-y-5">
                    {/* Header Row: Class Badge & Tag */}
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider ${themeStyles.tag}`}>
                        {c.tag}
                      </span>
                      <span className={`text-xs font-black px-3 py-1 rounded-xl uppercase tracking-wider ${
                        isHighlighted ? 'bg-slate-800 text-amber-300 border border-slate-700' : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700'
                      }`}>
                        {c.cls}
                      </span>
                    </div>

                    {/* Course Title */}
                    <h3 className={`text-2xl font-black leading-snug transition-colors ${
                      isHighlighted ? 'text-white' : 'text-slate-900 dark:text-white group-hover:text-[#FF6500]'
                    }`}>
                      {c.title}
                    </h3>

                    {/* Board */}
                    <p className={`text-xs font-extrabold uppercase tracking-wider ${isHighlighted ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                      {c.board}
                    </p>

                    {/* Features Box */}
                    <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${themeStyles.features}`}>
                      <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span>{c.features}</span>
                    </div>
                  </div>

                  {/* CTA Row - Aligned at Exact Vertical Baseline */}
                  <div className="pt-5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between mt-6">
                    <span className={`text-xs font-black ${isHighlighted ? 'text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      Full Syllabus Access
                    </span>
                    <span className={`text-sm font-black flex items-center gap-1 group-hover:translate-x-1 transition-transform ${themeStyles.cta}`}>
                      View Course <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ITEM 4: ENHANCED 5-STEP LEARNING JOURNEY / PROCESS FLOW */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-lg max-w-[1280px] mx-auto space-y-6 mt-12">
            <div className="text-center space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-[#0284C7]">HOW IT WORKS</span>
              <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Your 5-Step Learning Progression</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6 pt-2">
              {[
                { step: '01', title: 'Choose Course', desc: 'Select your class & target batch', icon: <BookOpen className="w-5 h-5 text-[#0284C7]" />, bg: 'bg-sky-50/90 dark:bg-slate-800/80 border-sky-200/80 dark:border-slate-700' },
                { step: '02', title: 'View Details', desc: 'Explore chapters & demo tests', icon: <Sparkles className="w-5 h-5 text-orange-500" />, bg: 'bg-orange-50/90 dark:bg-slate-800/80 border-orange-200/80 dark:border-slate-700' },
                { step: '03', title: 'Secure Payment', desc: 'Unlock instant course access', icon: <CreditCard className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50/90 dark:bg-slate-800/80 border-emerald-200/80 dark:border-slate-700' },
                { step: '04', title: 'Course Unlocked', desc: 'Access videos & MCQ tests', icon: <Key className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50/90 dark:bg-slate-800/80 border-purple-200/80 dark:border-slate-700' },
                { step: '05', title: 'Start Learning', desc: 'Build concept clarity with Manika', icon: <Flame className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50/90 dark:bg-slate-800/80 border-amber-200/80 dark:border-slate-700' }
              ].map((s, idx) => (
                <div key={idx} className={`${s.bg} p-5 rounded-2xl border space-y-3 relative flex flex-col justify-between h-full shadow-xs hover:shadow-md transition-all`}>
                  <div className="flex items-center justify-between">
                    <span className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-xs">
                      {s.icon}
                    </span>
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      STEP {s.step}
                    </span>
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-slate-900 dark:text-white mb-1">{s.title}</h5>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>



      {/* ================= 🏆 RESULTS: PROVEN ACADEMIC EXCELLENCE ================= */}
      <section id="results-gallery" className="relative z-10 py-14 lg:py-20 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#FF6500]">PROVEN ACADEMIC EXCELLENCE</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] dark:text-white tracking-tight">Our Board Results</h2>
            <p className="text-base sm:text-lg font-semibold text-slate-600 dark:text-slate-400">
              Outstanding results that speak volumes about our concepts and pedagogy.
            </p>
          </div>

          {/* Tab Selector Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { id: '2025', label: 'Class of 2025 Results' },
              { id: '2024', label: 'Class of 2024 Results' },
              { id: '2023', label: 'Class of 2023 Results' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setResultsYear(tab.id)}
                className={`px-5 py-3 rounded-2xl font-black transition-all border cursor-pointer ${
                  resultsYear === tab.id
                    ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Result Banner Image (Clean Borderless Wrapper) */}
          <div className="max-w-[850px] mx-auto rounded-3xl overflow-hidden shadow-2xl bg-transparent">
            {resultsYear === '2025' && (
              <img 
                src={results2025} 
                alt="Mathematics Results 2025" 
                className="w-full h-auto object-contain rounded-3xl"
              />
            )}
            {resultsYear === '2024' && (
              <img 
                src={results2024} 
                alt="Mathematics Results 2024" 
                className="w-full h-auto object-contain rounded-3xl"
              />
            )}
            {resultsYear === '2023' && (
              <img 
                src={results2023} 
                alt="Mathematics Results 2023" 
                className="w-full h-auto object-contain rounded-3xl"
              />
            )}
          </div>

        </div>
      </section>

      {/* ================= ITEM 12: REAL "TEACHER / MENTOR" SECTION WITH PHOTO #9 ================= */}
      <section className="relative z-10 py-14 lg:py-20 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left: Photo 9 - Teacher holding 4 Mathematics Books */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group max-w-[400px] w-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#0284C7] to-emerald-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 bg-transparent shadow-2xl">
                  <img 
                    src={teacherBooks} 
                    alt="Manika Ma'am holding Mathematics textbooks" 
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-5 text-center">
                    <span className="text-xs font-black text-sky-400 uppercase tracking-widest block mb-1">AUTHENTIC CURRICULUM</span>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-200">Personally Authoring NCERT, Exemplar & RD Sharma Mastery Sets</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Mentor Story + Quote + 3 Pillars */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <span className="text-xs font-black uppercase tracking-widest text-[#0284C7]">TEACHER-LED PLATFORM</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Learn from someone who makes Mathematics easier.
              </h2>

              <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/90 border border-amber-400/50 shadow-xl space-y-1.5 max-w-lg">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-400">FOUNDER & LEAD MATHEMATICS EDUCATOR</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">Manika Maheshwari</div>
                <p className="text-xs font-extrabold text-slate-300">Personalized Coaching & Curriculum Creator for Class 6–12</p>
              </div>

              <blockquote className="p-5 rounded-2xl bg-slate-800/60 border-l-4 border-[#0284C7] text-base font-bold text-slate-200 italic leading-relaxed">
                "My goal is not to make students memorise Mathematics. It's to make them understand it."
              </blockquote>

              {/* 3 Personalised Support Pillars embedded directly in Teacher Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-1.5">
                  <div className="text-sky-400 font-black text-base flex items-center gap-2">
                    <User className="w-4 h-4 text-sky-400" />
                    <span>1-on-1 Doubt Solving</span>
                  </div>
                  <div className="text-xs font-medium text-slate-300 leading-relaxed">Direct chat assistance with Manika Ma'am for instant step-by-step clarity</div>
                </div>
                <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-1.5">
                  <div className="text-emerald-400 font-black text-base flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Worksheet Reviews</span>
                  </div>
                  <div className="text-xs font-medium text-slate-300 leading-relaxed">Personalised grading & corrections on submitted homework sheets</div>
                </div>
                <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-1.5">
                  <div className="text-amber-400 font-black text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Personal Guidance</span>
                  </div>
                  <div className="text-xs font-medium text-slate-300 leading-relaxed">Individual mentorship to target weak chapter areas & boost confidence</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= SECTION 4: MCQ TESTING PREVIEW ================= */}
      <section id="mcq-engine" className="relative z-10 py-14 lg:py-20 bg-[#F8FAFC]/90 dark:bg-[#1E293B]/90 border-t border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#FF6500]">TIMED MCQ PRACTICE ENGINE</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] dark:text-white tracking-tight">Think You Know the Chapter? Prove It.</h2>
            <p className="text-base sm:text-lg font-semibold text-slate-600 dark:text-slate-400">
              Practice chapter-wise, challenge yourself with timed tests, and see how you're improving.
            </p>
          </div>

          {/* Substantial Mock Test Interface Preview (Consistently Theme-Adapted) */}
          <div className="max-w-4xl lg:max-w-5xl mx-auto bg-white dark:bg-slate-950 rounded-3xl p-6 sm:p-10 text-slate-900 dark:text-white shadow-2xl space-y-8 border border-slate-300 dark:border-slate-800 relative overflow-hidden transition-colors duration-300">
            
            {/* Top Engine Header Bar */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5 text-sm font-black gap-4">
              <div className="flex items-center gap-3">
                <span className="bg-orange-500 text-white px-4 py-1.5 rounded-full uppercase text-xs sm:text-sm tracking-wider font-black">TRIGONOMETRY</span>
                <span className="text-slate-700 dark:text-slate-300 text-base sm:text-lg">CLASS 10 CHAPTER TEST #4</span>
              </div>
              <div className="flex items-center gap-5 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                <span className="bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-extrabold">20 Questions</span>
                <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-800 flex items-center gap-2 font-black">
                  <Clock className="w-4 h-4" /> 24:15 Remaining
                </span>
              </div>
            </div>

            {/* Question Body */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-[#0284C7] dark:text-sky-400 tracking-widest uppercase">Question 07 of 20</span>
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Mark: +4.0 / -1.0</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-relaxed">
                What is the simplified value of the trigonometric identity <code className="bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl text-[#0284C7] dark:text-orange-300 font-mono text-xl sm:text-2xl border border-slate-200 dark:border-slate-700">sin²θ + cos²θ</code>?
              </h3>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 text-base sm:text-lg font-bold">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-300 flex items-center gap-3.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-center text-sm font-black">A</span>
                  <span>0</span>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[#0284C7] border border-sky-400 text-white flex items-center justify-between font-black shadow-lg">
                  <div className="flex items-center gap-3.5">
                    <span className="w-8 h-8 rounded-full bg-white text-[#0284C7] flex items-center justify-center text-sm font-black">B</span>
                    <span className="text-lg sm:text-xl">1</span>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-300 flex items-center gap-3.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-center text-sm font-black">C</span>
                  <span>tan θ</span>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-300 flex items-center gap-3.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-center text-sm font-black">D</span>
                  <span>2</span>
                </div>
              </div>
            </div>

            {/* Explanation & Live Score Banner */}
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-sm sm:text-base font-black gap-4">
              <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>Explanation: By Pythagorean Identity, sin²θ + cos²θ = 1 for all real angles θ.</span>
              </div>
              <button 
                onClick={() => scrollToLoginPortal('LOGIN')}
                className="px-6 py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white transition-all flex items-center gap-2 active:scale-95 text-xs sm:text-sm font-black group cursor-pointer"
              >
                <span>Take Full Practice Test</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>

        </div>
      </section>



      {/* ================= SECTION 6: FORMULA HUB PREVIEW ================= */}
      <section id="formula-hub" className="relative z-10 py-20 lg:py-28 bg-[#F8FAFC]/90 dark:bg-[#1E293B]/90 border-t border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#FF6500]">PRINTABLE REVISION HANDBOOKS</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] dark:text-white tracking-tight">Your Formula Book, Always Within Reach.</h2>
            <p className="text-base sm:text-lg font-semibold text-slate-600 dark:text-slate-400">
              Quickly revisit the formulas you need while learning and practising.
            </p>
          </div>

          {/* Category Tabs & Formula Cards */}
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Glassmorphic Category Bar with Warm Orange & Yellow Accents */}
            <div className="p-2 rounded-full bg-amber-50/80 dark:bg-slate-800/90 border border-amber-200/80 dark:border-slate-700 shadow-md flex items-center justify-center gap-2 max-w-xl mx-auto overflow-x-auto">
              {['Algebra', 'Trigonometry', 'Geometry', 'Calculus'].map(tab => {
                const isSelected = formulaTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFormulaTab(tab)}
                    className={`px-6 py-3 rounded-full font-black text-sm sm:text-base transition-all duration-300 cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-to-r from-[#FF6500] via-amber-500 to-yellow-500 text-white shadow-md shadow-orange-500/20 scale-105' 
                        : 'bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-100/60 dark:hover:bg-slate-800 hover:text-orange-600'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Formula Cards with Vibrant Glowing Accents in Dark Mode & Subtle Colors in Light Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {formulaData[formulaTab].map((item, idx) => {
                const colorStyles = [
                  { 
                    bg: 'bg-gradient-to-br from-orange-50/90 via-white to-amber-50/60 dark:from-slate-900/95 dark:via-slate-900 dark:to-orange-950/40 border-orange-200/90 dark:border-orange-500/40 dark:shadow-[0_0_25px_rgba(255,101,0,0.15)]', 
                    text: 'text-[#FF6500] dark:text-orange-400', 
                    boxBg: 'bg-orange-100/60 dark:bg-slate-950/90 border-orange-200 dark:border-orange-500/40 text-slate-900 dark:text-amber-300', 
                    tagBg: 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-400/40' 
                  },
                  { 
                    bg: 'bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/60 dark:from-slate-900/95 dark:via-slate-900 dark:to-amber-950/40 border-amber-200/90 dark:border-amber-500/40 dark:shadow-[0_0_25px_rgba(245,158,11,0.15)]', 
                    text: 'text-amber-700 dark:text-amber-400', 
                    boxBg: 'bg-amber-100/60 dark:bg-slate-950/90 border-amber-200 dark:border-amber-500/40 text-slate-900 dark:text-yellow-300', 
                    tagBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-400/40' 
                  },
                  { 
                    bg: 'bg-gradient-to-br from-emerald-50/90 via-white to-green-50/60 dark:from-slate-900/95 dark:via-slate-900 dark:to-emerald-950/40 border-emerald-200/90 dark:border-emerald-500/40 dark:shadow-[0_0_25px_rgba(16,185,129,0.15)]', 
                    text: 'text-emerald-700 dark:text-emerald-400', 
                    boxBg: 'bg-emerald-100/60 dark:bg-slate-950/90 border-emerald-200 dark:border-emerald-500/40 text-slate-900 dark:text-emerald-300', 
                    tagBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/40' 
                  },
                  { 
                    bg: 'bg-gradient-to-br from-sky-50/90 via-white to-indigo-50/60 dark:from-slate-900/95 dark:via-slate-900 dark:to-sky-950/40 border-sky-200/90 dark:border-sky-500/40 dark:shadow-[0_0_25px_rgba(2,132,199,0.15)]', 
                    text: 'text-[#0284C7] dark:text-sky-400', 
                    boxBg: 'bg-sky-100/60 dark:bg-slate-950/90 border-sky-200 dark:border-sky-500/40 text-slate-900 dark:text-sky-300', 
                    tagBg: 'bg-sky-100 dark:bg-sky-500/20 text-sky-900 dark:text-sky-300 border-sky-200 dark:border-sky-400/40' 
                  }
                ][idx % 4];

                return (
                  <div 
                    key={idx} 
                    className={`p-6 rounded-3xl ${colorStyles.bg} border space-y-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black px-3.5 py-1 rounded-full ${colorStyles.tagBg} uppercase tracking-wider border`}>
                        {item.name}
                      </span>
                      <Bookmark className={`w-4 h-4 ${colorStyles.text}`} />
                    </div>

                    <div className={`text-lg sm:text-2xl font-black font-mono ${colorStyles.boxBg} p-4 sm:p-5 rounded-2xl border flex items-center justify-between leading-snug shadow-xs`}>
                      <span>{item.formula}</span>
                      <Sparkles className={`w-5 h-5 ${colorStyles.text} shrink-0 ml-2`} />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </section>

      {/* ================= SECTION 7: PERFORMANCE DASHBOARD PREVIEW ================= */}
      <section className="relative z-10 py-20 lg:py-28 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#FF6500]">ANALYTICS & SCORECARDS</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] dark:text-white tracking-tight">See Your Progress. Keep Improving.</h2>
            <p className="text-base sm:text-lg font-semibold text-slate-600 dark:text-slate-400">
              Understand where you're strong and where you need more practice.
            </p>
          </div>

          {/* Visual Mock Performance Dashboard with Orange, Yellow, and Green Accents */}
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-orange-50/40 via-amber-50/20 to-emerald-50/40 dark:from-slate-900/95 dark:via-slate-900 dark:to-slate-950 rounded-3xl p-7 sm:p-10 border border-amber-200/90 dark:border-amber-500/30 dark:shadow-[0_0_35px_rgba(255,101,0,0.12)] space-y-7 relative overflow-hidden">
            
            {/* Header Row with Real-Time Indicator */}
            <div className="flex items-center justify-between border-b border-amber-200/80 dark:border-slate-800 pb-5 text-sm sm:text-base font-black">
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-5 h-5 text-[#FF6500]" />
                <span className="text-slate-900 dark:text-white tracking-tight">MATHEMATICS PROGRESS OVERVIEW</span>
              </div>
              <span className="px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-400/40">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                CLASS 10 PREVIEW
              </span>
            </div>

            <div className="space-y-6 text-sm sm:text-base font-black">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[#FF6500]" /> Algebra & Polynomials
                  </span>
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-400/40">
                    90% Mastery
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden shadow-inner">
                  <div className="bg-gradient-to-r from-[#FF6500] to-amber-500 h-2.5 rounded-full w-[90%] transition-all duration-500 shadow-xs"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-amber-500" /> Trigonometry & Identities
                  </span>
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-400/40">
                    72% Mastery
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden shadow-inner">
                  <div className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2.5 rounded-full w-[72%] transition-all duration-500 shadow-xs"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-500" /> Coordinate Geometry
                  </span>
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-400/40">
                    81% Mastery
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden shadow-inner">
                  <div className="bg-gradient-to-r from-emerald-400 to-green-500 h-2.5 rounded-full w-[81%] transition-all duration-500 shadow-xs"></div>
                </div>
              </div>
            </div>

            {/* Latest Board Attempt Banner (Subtle Orange & Green Theme) */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-emerald-500/15 dark:from-slate-800/90 dark:via-orange-950/40 dark:to-slate-900 border border-orange-300/80 dark:border-orange-500/30 text-slate-900 dark:text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-[#FF6500]" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#FF6500] block">REAL-TIME EVALUATION</span>
                  <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Latest Board Model Test Attempt</p>
                </div>
              </div>

              <span className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black text-sm shadow-md shadow-orange-500/20 shrink-0">
                Score: 18 / 20 (90%)
              </span>
            </div>

          </div>

        </div>
      </section>





      {/* ================= SECTION 9: FAQ ACCORDION ================= */}
      <section id="faq" className="relative z-10 py-20 lg:py-28 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#0284C7]">FREQUENTLY ASKED QUESTIONS</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] dark:text-white tracking-tight">Questions? We've Got You Covered.</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4 text-sm sm:text-base font-black">
            {faqList.map((item, idx) => (
              <div 
                key={idx}
                className="bg-[#F8FAFC] dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-base sm:text-lg font-black cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-[#0284C7]' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 pt-5 text-slate-600 dark:text-slate-300 font-semibold leading-relaxed border-t border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 text-sm sm:text-base">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ================= ITEM 15: BRANDED FINAL CTA ================= */}
      <section className="relative z-10 py-20 lg:py-28 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white border-t border-slate-800 transition-colors duration-300">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#FF6500]">START YOUR ACADEMIC SUCCESS</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Ready to make Mathematics your strongest subject?
            </h2>
            <p className="text-base sm:text-xl font-bold text-slate-300 max-w-xl mx-auto">
              Learn the concept. Practice smart. Build confidence.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="#courses"
              className="px-9 py-4 rounded-2xl bg-[#FF6500] hover:bg-orange-600 text-white font-black text-base shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2 group"
            >
              <span>Explore Courses</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>

            <button
              onClick={() => {
                const el = document.getElementById('login-portal');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-9 py-4 rounded-2xl bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 text-slate-900 dark:text-white font-black text-base border border-slate-300 dark:border-white/20 shadow-sm transition-all flex items-center gap-2"
            >
              <User className="w-5 h-5" />
              <span>Student Login</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= ITEM 16: STRUCTURED 4-COLUMN FOOTER ================= */}
      <footer className="relative z-10 bg-slate-950 text-white pt-20 pb-10 border-t border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            
            {/* Col 1: Brand & Logo */}
            <div className="space-y-4">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md inline-block">
                <img src={logoImg} alt="Sarvottam Diksha Logo" className="w-44 h-auto object-contain select-none" />
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-semibold">
                Official Sarvottam Diksha Mathematics Learning Platform. Dedicated to building deep concept clarity, timed test confidence, and board exam excellence for Class 6–12.
              </p>
            </div>

            {/* Col 2: Courses */}
            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-widest text-[#0284C7]">Courses</h4>
              <ul className="space-y-2 text-xs sm:text-sm font-bold text-slate-400">
                <li><button onClick={() => scrollToLoginPortal('LOGIN')} className="hover:text-white transition-colors cursor-pointer">Class 6 Mathematics</button></li>
                <li><button onClick={() => scrollToLoginPortal('LOGIN')} className="hover:text-white transition-colors cursor-pointer">Class 7 Mathematics</button></li>
                <li><button onClick={() => scrollToLoginPortal('LOGIN')} className="hover:text-white transition-colors cursor-pointer">Class 8 Mathematics</button></li>
                <li><button onClick={() => scrollToLoginPortal('LOGIN')} className="hover:text-white transition-colors cursor-pointer">Class 9 Mathematics</button></li>
                <li><button onClick={() => scrollToLoginPortal('LOGIN')} className="hover:text-white transition-colors cursor-pointer">Class 10 ABHYAAS Mastery</button></li>
                <li><button onClick={() => scrollToLoginPortal('LOGIN')} className="hover:text-white transition-colors cursor-pointer">Class 11 Higher Maths</button></li>
                <li><button onClick={() => scrollToLoginPortal('LOGIN')} className="hover:text-white transition-colors cursor-pointer">Class 12 Target 100 Batch</button></li>
              </ul>
            </div>

            {/* Col 3: Platform */}
            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-widest text-[#FF6500]">Platform</h4>
              <ul className="space-y-2 text-xs sm:text-sm font-bold text-slate-400">
                <li><button onClick={() => { const el = document.getElementById('login-portal'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors">Student Login</button></li>
                <li><a href="#features" className="hover:text-white transition-colors">Practice Modules</a></li>
                <li><a href="#mcq-engine" className="hover:text-white transition-colors">Timed Tests Engine</a></li>
                <li><a href="#formula-hub" className="hover:text-white transition-colors">Formula Hub</a></li>
                <li><a href="#results-gallery" className="hover:text-white transition-colors">Board Results</a></li>
              </ul>
            </div>

            {/* Col 4: Support */}
            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400">Support</h4>
              <ul className="space-y-2 text-xs sm:text-sm font-bold text-slate-400">
                <li><a href="#faq" className="hover:text-white transition-colors">Frequently Asked Questions</a></li>
                <li><button onClick={() => setShowContactModal(true)} className="hover:text-white transition-colors cursor-pointer font-bold">Contact Support</button></li>
                <li><button onClick={() => navigate('/legal/privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button></li>
                <li><button onClick={() => navigate('/legal/terms')} className="hover:text-white transition-colors cursor-pointer">Terms & Conditions</button></li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar: Copyright + Social Icons */}
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4 font-semibold">
            <p>© 2026 Sarvottam Diksha Mathematics. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <a href="#" className="hover:text-[#0284C7] transition-colors"><Youtube className="w-5 h-5" /></a>
              <a href="#" className="hover:text-[#FF6500] transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="hover:text-[#0284C7] transition-colors"><Facebook className="w-5 h-5" /></a>
            </div>
          </div>

        </div>
      </footer>

      {/* ================= MANIKA MA'AM CONTACT SUPPORT MODAL ================= */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 overflow-hidden">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with Ma'am's Photo and Credentials */}
            <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-[#FF6500] rounded-2xl blur-md opacity-50"></div>
                <img 
                  src={teacherHero} 
                  alt="Manika Maheshwari - Founder & Lead Mathematics Educator" 
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover object-[center_12%] border-2 border-white dark:border-slate-800 shadow-md"
                />
              </div>

              <div className="space-y-1.5 text-center sm:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-200 dark:border-amber-800">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>FOUNDER & LEAD EDUCATOR</span>
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Manika Maheshwari</h3>
                <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Sarvottam Diksha Mathematics Academy</p>
              </div>
            </div>

            {/* Contact Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm font-bold">
              
              {/* Phone / WhatsApp */}
              <div className="p-4 rounded-2xl bg-orange-50/80 dark:bg-slate-800/80 border border-orange-200/80 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-[#FF6500] dark:text-orange-400 font-black text-sm">
                  <Phone className="w-4 h-4" />
                  <span>Direct Call / WhatsApp</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-black text-base">+91 98765 43210</p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Instant Doubt Clearing & Admissions</span>
              </div>

              {/* Email */}
              <div className="p-4 rounded-2xl bg-sky-50/80 dark:bg-slate-800/80 border border-sky-200/80 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-[#0284C7] dark:text-sky-400 font-black text-sm">
                  <Mail className="w-4 h-4" />
                  <span>Official Email</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-black text-xs sm:text-sm break-all">manika@sarvottamdiksha.com</p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Personalized Academic Support</span>
              </div>

              {/* Support Hours */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-slate-800/80 border border-emerald-200/80 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Student Support Hours</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-black text-xs sm:text-sm">Mon – Sat: 10:00 AM – 7:00 PM</p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">1-on-1 Doubt Clarification</span>
              </div>

              {/* Location */}
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-slate-800/80 border border-amber-200/80 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>Academy Campus</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-black text-xs sm:text-sm">Sarvottam Diksha Main Branch</p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Class 6–12 Mathematics Coaching</span>
              </div>

            </div>

            {/* Direct Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="tel:+919876543210"
                className="flex-1 py-3 px-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Call Ma'am Directly</span>
              </a>
              <a
                href="mailto:manika@sarvottamdiksha.com"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email to Ma'am</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* ================= 6. ⬆️ FLOATING "BACK TO TOP" BUTTON ================= */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-xl flex items-center justify-center transition-all duration-300 active:scale-95 border border-sky-400 group"
          title="Back to Top"
        >
          <ArrowUp className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

    </div>
  );
}
