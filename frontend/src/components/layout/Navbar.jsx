import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { useTheme } from '../../context/ThemeContext';
import logoImg from '../../assets/logo.png';
import logoDarkImg from '../../assets/logo-dark.png';
import NotificationModal from './NotificationModal';
import StudentDrawer from './StudentDrawer';
import { 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  MessageSquare,
  Trophy,
  ShieldCheck,
  User,
  Sun,
  Moon,
  BookOpen,
  Award,
  Home as HomeIcon
} from 'lucide-react';

export default function Navbar({ onOpenAuthModal }) {
  const { user, logout, isAdmin } = useAuth();
  const { branding } = useBranding();
  const { theme, setTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleNavClick = (e, path) => {
    if (!user) {
      e.preventDefault();
      onOpenAuthModal();
    }
  };

  const isStudentPortalPage = Boolean(user && user?.role !== 'ADMIN' && !isAdmin && !location.pathname.startsWith('/admin'));

  return (
    <nav className={`sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors duration-300 ${isStudentPortalPage ? 'lg:pl-64' : 'lg:pl-0'}`}>
      
      {/* Real-Time Notification Bell Modal */}
      <NotificationModal
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        user={user}
      />

      {/* Student Profile Drawer */}
      <StudentDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenAuthModal={onOpenAuthModal}
        user={user}
      />

      {/* Main Navbar Container */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
          
          {/* ================= LEFT SIDE: MOBILE LOGO & DESKTOP BREADCRUMB ================= */}
          <div className="flex items-center gap-3 shrink-0">

            {/* Mobile / Tablet Logo */}
            <Link to="/" onClick={(e) => handleNavClick(e, '/')} className="flex items-center gap-2 group py-1 lg:hidden shrink-0">
              <img 
                src={logoImg} 
                alt="Sarvottam Diksha" 
                className="h-10 sm:h-12 w-auto object-contain dark:hidden block"
              />
              <img 
                src={logoDarkImg} 
                alt="Sarvottam Diksha" 
                className="h-10 sm:h-12 w-auto object-contain hidden dark:block"
              />
            </Link>

            {/* Desktop Portal Header Title */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200">
              <span className="px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 font-mono text-[11px]">
                SARVOTTAM DIKSHA
              </span>
              <span className="text-slate-400 font-normal">•</span>
              <span className="text-slate-600 dark:text-slate-400 font-bold">Classes 6–12 Board & Higher Mathematics</span>
            </div>
          </div>

          {/* ================= CENTER / RIGHT HEADER CONTROLS ================= */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            
            {/* Segmented Light/Dark Theme Control Pill */}
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-2.5 py-1 rounded-xl font-black text-xs transition-all flex items-center gap-1 cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-[#0284C7] shadow-2xs border border-slate-200/80'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Switch to Light Mode"
              >
                <Sun className={`w-3.5 h-3.5 shrink-0 ${theme === 'light' ? 'text-amber-500 fill-amber-400' : ''}`} />
                <span className="whitespace-nowrap">Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-2.5 py-1 rounded-xl font-black text-xs transition-all flex items-center gap-1 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-amber-400 shadow-2xs border border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Switch to Dark Mode"
              >
                <Moon className={`w-3.5 h-3.5 shrink-0 ${theme === 'dark' ? 'text-amber-400 fill-amber-400' : ''}`} />
                <span className="whitespace-nowrap">Dark</span>
              </button>
            </div>

            {/* Notification Bell Button */}
            <button 
              onClick={() => {
                if (!user) {
                  onOpenAuthModal();
                } else {
                  setNotificationOpen(true);
                }
              }}
              className="p-2 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 rounded-xl hover:bg-orange-50/80 dark:hover:bg-slate-800 relative transition-all active:scale-95 shrink-0 cursor-pointer"
              title="Notifications Center"
            >
              <Bell className="w-5 h-5 shrink-0" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full"></span>
            </button>

            {/* Profile Card & Explicit Logout Button */}
            {user ? (
              <div className="flex items-center gap-2 shrink-0">
                {/* Account Details Button */}
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="flex items-center gap-2 bg-sky-50 dark:bg-slate-800/90 px-3 py-1.5 rounded-2xl border border-sky-200/90 dark:border-slate-700 shadow-2xs hover:bg-sky-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0 max-w-[170px]"
                  title="Click to view full Account Details & Settings"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs uppercase text-white shadow-xs shrink-0 ${
                    isAdmin ? 'bg-purple-900' : 'bg-[#0284C7]'
                  }`}>
                    {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'SD'}
                  </div>
                  <div className="text-left leading-tight hidden lg:block overflow-hidden">
                    <span className="text-xs font-black text-slate-900 dark:text-white block truncate">{user.name}</span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block truncate">
                      {isAdmin ? 'Admin Teacher' : 'Student'}
                    </span>
                  </div>
                </button>

                {/* Explicit Direct Logout Button */}
                <button
                  onClick={() => {
                    logout();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 transition-all flex items-center gap-1.5 cursor-pointer text-xs font-black shadow-xs active:scale-95"
                  title="Log Out of your account"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span className="font-extrabold whitespace-nowrap">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-5 py-2 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>

          {/* ================= MOBILE / TABLET MENU TOGGLE BUTTON ================= */}
          <div className="lg:hidden flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-lg text-xs font-black cursor-pointer ${theme === 'light' ? 'bg-white text-amber-500 shadow-xs' : 'text-slate-400'}`}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-lg text-xs font-black cursor-pointer ${theme === 'dark' ? 'bg-slate-900 text-amber-400 shadow-xs' : 'text-slate-400'}`}
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Nav Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-4 space-y-2 font-black text-xs shadow-lg">
          {isAdmin ? (
            <>
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#0284C7]">Admin Portal</Link>
              <Link to="/chats" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800 dark:text-slate-200">Doubts Inbox</Link>
              <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800 dark:text-slate-200">Common Leaderboard</Link>
              <Link to="/store" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800 dark:text-slate-200">Course Catalog</Link>
            </>
          ) : (
            <>
              <Link to="/" onClick={(e) => { setMobileMenuOpen(false); handleNavClick(e, '/'); }} className="block py-2 text-slate-800 dark:text-slate-200">Home</Link>
              <Link to="/store" onClick={(e) => { setMobileMenuOpen(false); handleNavClick(e, '/store'); }} className="block py-2 text-slate-800 dark:text-slate-200">Course Catalog</Link>
              <Link to="/free-test" onClick={(e) => { setMobileMenuOpen(false); handleNavClick(e, '/free-test'); }} className="block py-2 text-slate-800 dark:text-slate-200">Free Tests</Link>
              <Link to="/chats" onClick={(e) => { setMobileMenuOpen(false); handleNavClick(e, '/chats'); }} className="block py-2 text-slate-800 dark:text-slate-200">Doubts Inbox</Link>
              <Link to="/leaderboard" onClick={(e) => { setMobileMenuOpen(false); handleNavClick(e, '/leaderboard'); }} className="block py-2 text-slate-800 dark:text-slate-200">Leaderboard</Link>
            </>
          )}

          {user && (
            <button
              onClick={() => { setMobileMenuOpen(false); logout(); }}
              className="w-full text-left py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-black text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-800 cursor-pointer mt-2"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Logout ({user?.name || 'Account'})</span>
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
