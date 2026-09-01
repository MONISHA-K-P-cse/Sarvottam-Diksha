import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import logoImg from '../../assets/logo.png';
import logoDarkImg from '../../assets/logo-dark.png';
import { 
  Home as HomeIcon, 
  BookOpen, 
  Award, 
  MessageSquare, 
  Trophy, 
  ShieldCheck, 
  GraduationCap,
  LogOut, 
  Sun, 
  Moon,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ onOpenAuthModal }) {
  const { user, logout, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Outer sidebar is ONLY for logged-in students. Hide for guests, admin users, and /admin routes!
  if (!user || isAdmin || user?.role === 'ADMIN' || location.pathname.startsWith('/admin')) {
    return null;
  }

  const navLinks = isAdmin ? [
    { label: 'Admin Portal', path: '/', icon: ShieldCheck, color: 'text-purple-600 dark:text-purple-400', activeBg: 'bg-purple-900 text-white' },
    { label: 'Doubts Inbox', path: '/chats', icon: MessageSquare, color: 'text-sky-500', activeBg: 'bg-[#0284C7] text-white' },
    { label: 'Leaderboard', path: '/leaderboard', icon: Trophy, color: 'text-amber-500', activeBg: 'bg-amber-600 text-white' },
    { label: 'Course Catalog', path: '/store', icon: BookOpen, color: 'text-orange-500', activeBg: 'bg-orange-600 text-white' },
  ] : [
    { label: 'Home Dashboard', path: '/', icon: HomeIcon, color: 'text-orange-500', activeBg: 'bg-gradient-to-r from-[#FF6500] to-amber-500 text-white' },
    { label: 'Course Catalog', path: '/store', icon: BookOpen, color: 'text-amber-500', activeBg: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' },
    { label: 'Free Tests', path: '/free-test', icon: Award, color: 'text-yellow-500', activeBg: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white' },
    { label: 'Doubts Inbox', path: '/chats', icon: MessageSquare, color: 'text-sky-500', activeBg: 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white' },
    { label: 'Leaderboard', path: '/leaderboard', icon: Trophy, color: 'text-emerald-500', activeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' },
    ...(user ? [{ label: 'My Enrolled Courses', path: '/my-courses', icon: GraduationCap, color: 'text-teal-500', activeBg: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white' }] : [])
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 bottom-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 shadow-lg justify-between transition-colors duration-300">
      
      {/* Top Branding Section */}
      <div className="pt-5 px-5 pb-3 space-y-4">
        <Link to="/" className="flex items-center justify-start group pl-1">
          <img 
            src={logoImg} 
            alt="Sarvottam Diksha" 
            className="h-16 sm:h-18 w-auto object-contain max-w-[220px] dark:hidden block scale-125 origin-left transition-transform duration-200 group-hover:scale-130"
          />
          <img 
            src={logoDarkImg} 
            alt="Sarvottam Diksha" 
            className="h-16 sm:h-18 w-auto object-contain max-w-[220px] hidden dark:block scale-125 origin-left transition-transform duration-200 group-hover:scale-130"
          />
        </Link>

        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/80 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-black text-purple-900 dark:text-purple-300">
            <span className="font-mono text-sm text-purple-600 dark:text-purple-400">∑</span>
            <span className="uppercase tracking-wider text-[11px]">MATH ACADEMY</span>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="px-4 flex-1 space-y-1.5 overflow-y-auto no-scrollbar py-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 block mb-2 font-mono">
          MAIN MENU
        </span>

        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.path);
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-black text-xs transition-all duration-200 cursor-pointer ${
                active 
                  ? `${link.activeBg} shadow-md` 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : link.color}`} />
                <span className="truncate">{link.label}</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 shrink-0 opacity-60 ${active ? 'text-white' : 'text-slate-400'}`} />
            </Link>
          );
        })}
      </div>

      {/* Footer User & Theme & Logout Section */}
      <div className="p-4 border-t border-slate-200/90 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
        
        {/* Theme Switcher */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex-1 py-1.5 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              theme === 'light'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex-1 py-1.5 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-900 text-amber-400 shadow-xs border border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>
        </div>

        {/* User Details & Direct Logout */}
        {user ? (
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs uppercase text-white shadow-xs shrink-0 ${
                isAdmin ? 'bg-purple-900' : 'bg-[#0284C7]'
              }`}>
                {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'SD'}
              </div>
              <div className="flex-1 overflow-hidden leading-tight">
                <span className="text-xs font-black text-slate-900 dark:text-white block truncate">{user.name}</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block truncate">
                  {isAdmin ? 'Admin Teacher' : 'Student Account'}
                </span>
              </div>
            </div>

            {/* Direct Logout Button */}
            <button
              onClick={logout}
              className="w-full py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 font-black text-xs flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0 text-rose-500" />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="w-full py-2.5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Sign In / Register
          </button>
        )}
      </div>

    </aside>
  );
}
