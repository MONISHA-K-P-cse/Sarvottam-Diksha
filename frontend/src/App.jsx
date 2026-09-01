import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrandingProvider } from './context/BrandingContext';
import { ThemeProvider } from './context/ThemeContext';

// Assets
import logoImg from './assets/logo.png';
import pencilIcon from './assets/pencil-icon.png';

// Layout
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import BottomNav from './components/layout/BottomNav';
import AuthModal from './components/auth/AuthModal';
import SplashScreen from './components/layout/SplashScreen';

// Gated Auth Screen
import GatedAuthScreen from './components/auth/GatedAuthScreen';

// Pages
import Home from './pages/Home';
import CourseCatalog from './pages/CourseCatalog';
import CourseDetail from './pages/CourseDetail';
import MyCourses from './pages/MyCourses';
import CourseViewer from './pages/CourseViewer';
import TestEngine from './pages/TestEngine';
import TestResult from './pages/TestResult';
import FreeResources from './pages/FreeResources';
import Chats from './pages/Chats';
import Leaderboard from './pages/Leaderboard';
import StudentProfile from './pages/StudentProfile';
import Downloads from './pages/Downloads';
import LegalPages from './pages/LegalPages';
import AdminDashboard from './pages/admin/AdminDashboard';
import CourseManagerPage from './pages/admin/CourseManagerPage';

function AppContent() {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  const isStudentPortalPage = Boolean(user && user?.role !== 'ADMIN' && !isAdmin && !location.pathname.startsWith('/admin'));
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#0284C7] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm font-black text-slate-200 tracking-wide">Loading Sarvottam Diksha...</div>
      </div>
    );
  }

  const handleFinishSplash = React.useCallback(() => {
    setShowSplash(false);
  }, []);

  // Allow reset-password route without enforcing gated login screen
  if (window.location.pathname === '/reset-password') {
    return <ResetPassword />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-orange-50/15 to-emerald-50/20 dark:from-[#1E293B] dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans transition-colors duration-300">
      
      {/* ================= GLOBAL AMBIENT BACKGROUND COLOR POP-UPS & FLOATING MATH WATERMARKS ================= */}
      <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden">
        {/* Soft Pastel Ambient Glowing Orbs */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-orange-400/20 via-amber-300/15 to-transparent blur-3xl animate-pulse dark:from-orange-600/10"></div>
        <div className="absolute top-[25%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-400/20 via-teal-300/15 to-transparent blur-3xl animate-pulse dark:from-emerald-600/10"></div>
        <div className="absolute top-[60%] left-[-10%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-amber-400/20 via-yellow-300/15 to-transparent blur-3xl animate-pulse dark:from-amber-600/10"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-sky-400/20 via-purple-300/15 to-transparent blur-3xl animate-pulse dark:from-sky-600/10"></div>

        {/* Floating Mathematics Watermark Pop-ups across Left & Right Margins */}
        <div className="hidden xl:block absolute left-5 top-28 text-[#FF6500]/30 dark:text-orange-500/15 font-mono font-black text-sm animate-float-math">
          <span>a² + b² = c²</span>
        </div>
        <div className="hidden xl:block absolute right-5 top-36 text-emerald-600/30 dark:text-emerald-500/15 font-mono font-black text-sm animate-float-math">
          <span>D = b² - 4ac</span>
        </div>
        <div className="hidden xl:block absolute left-6 top-1/4 text-amber-600/30 dark:text-amber-500/15 font-mono font-black text-sm animate-float-math">
          <span>sin²θ + cos²θ = 1</span>
        </div>
        <div className="hidden xl:block absolute right-6 top-1/3 text-[#0284C7]/30 dark:text-sky-500/15 font-mono font-black text-sm animate-float-math">
          <span>d = √((x₂-x₁)² + (y₂-y₁)²)</span>
        </div>
        <div className="hidden xl:block absolute left-5 top-1/2 text-emerald-600/30 dark:text-emerald-500/15 font-mono font-black text-sm animate-float-math">
          <span>Area = ½ × b × h</span>
        </div>
        <div className="hidden xl:block absolute right-5 top-3/5 text-amber-600/30 dark:text-amber-500/15 font-mono font-black text-sm animate-float-math">
          <span>∫ xⁿ dx = (xⁿ⁺¹)/(n+1)</span>
        </div>
        <div className="hidden xl:block absolute left-6 top-3/4 text-[#FF6500]/30 dark:text-orange-500/15 font-mono font-black text-sm animate-float-math">
          <span>P(A ∪ B) = P(A) + P(B)</span>
        </div>
        <div className="hidden xl:block absolute right-6 top-5/6 text-[#0284C7]/30 dark:text-sky-500/15 font-mono font-black text-sm animate-float-math">
          <span>tan θ = sin θ / cos θ</span>
        </div>
      </div>

      {/* Left Persistent App Sidebar */}
      <Sidebar onOpenAuthModal={() => setAuthModalOpen(true)} />

      {/* Top Navbar Header */}
      <Navbar onOpenAuthModal={() => setAuthModalOpen(true)} />

      {/* Main Application Body */}
      <main className={`flex-1 ${isStudentPortalPage ? 'lg:pl-64' : 'lg:pl-0'} pb-20 md:pb-8 relative z-10`}>
        <Routes>
          <Route path="/" element={user ? (user.role === 'ADMIN' ? <AdminDashboard /> : <Home />) : <GatedAuthScreen />} />
          <Route path="/store" element={user ? <CourseCatalog /> : <GatedAuthScreen />} />
          <Route path="/store/:id" element={user ? <CourseDetail /> : <GatedAuthScreen />} />
          <Route path="/course/:id" element={user ? <CourseDetail /> : <GatedAuthScreen />} />
          <Route path="/courses/:id" element={user ? <CourseDetail /> : <GatedAuthScreen />} />
          <Route path="/my-courses" element={user ? <MyCourses /> : <GatedAuthScreen />} />
          <Route path="/learn/:courseId" element={user ? <CourseViewer /> : <GatedAuthScreen />} />
          <Route path="/test/:quizId" element={user ? <TestEngine /> : <GatedAuthScreen />} />
          <Route path="/test-result/:attemptId" element={user ? <TestResult /> : <GatedAuthScreen />} />
          <Route path="/free-test" element={user ? <FreeResources /> : <GatedAuthScreen />} />
          <Route path="/chats" element={user ? <Chats /> : <GatedAuthScreen />} />
          <Route path="/leaderboard" element={user ? <Leaderboard /> : <GatedAuthScreen />} />
          <Route path="/profile" element={user ? <StudentProfile /> : <GatedAuthScreen />} />
          <Route path="/downloads" element={user ? <Downloads /> : <GatedAuthScreen />} />
          <Route path="/admin/courses/:courseId/manage" element={<CourseManagerPage />} />
          <Route path="/admin/courses/:courseId/preview" element={<CourseDetail isAdminPreview={true} />} />
          <Route path="/admin/courses/:id/manage" element={<CourseManagerPage />} />
          <Route path="/admin/courses/:id/preview" element={<CourseDetail isAdminPreview={true} />} />
          <Route path="/course-manage/:id" element={<CourseManagerPage />} />
          <Route path="/admin/course-manage/:id" element={<CourseManagerPage />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Bottom Mobile Tab Bar */}
      <BottomNav onOpenAuthModal={() => setAuthModalOpen(true)} />

      {/* Global Footer */}
      <div className="lg:pl-64">
        <Footer />
      </div>

      {/* Login / Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <BrandingProvider>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1E293B] relative transition-colors duration-300">
              <AppContent />
            </div>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </BrandingProvider>
  );
}
