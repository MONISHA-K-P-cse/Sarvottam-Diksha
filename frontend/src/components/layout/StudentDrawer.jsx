import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  User, 
  Download, 
  FolderOpen, 
  MessageSquare, 
  Edit3, 
  Settings, 
  HelpCircle, 
  Shield, 
  Share2, 
  ShieldCheck,
  BookOpen,
  Trophy,
  Home,
  LogOut
} from 'lucide-react';

export default function StudentDrawer({ isOpen, onClose, onOpenAuthModal }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [modalType, setModalType] = useState(null); // testimonials, guide, settings

  if (!isOpen) return null;

  const isAdmin = user?.role === 'ADMIN';

  const handleShareApp = () => {
    navigator.clipboard.writeText(window.location.origin);
    alert("Sarvottam Diksha App link copied! Share with fellow students.");
  };

  return (
    <div 
      className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-start justify-start animate-fade-in"
      onClick={onClose}
    >
      
      {/* Drawer Card Container */}
      <div 
        className="bg-white dark:bg-slate-900 h-full w-full max-w-xs sm:max-w-sm shadow-2xl overflow-y-auto flex flex-col justify-between p-6 space-y-6 animate-slide-right border-r border-slate-200 dark:border-slate-800 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="space-y-6">
          
          {/* Close Button & Header - Role Differentiated */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-1.5">
              {isAdmin ? (
                <span className="text-xs font-black text-purple-700 dark:text-purple-300 uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  ADMIN CONTROL MENU
                </span>
              ) : (
                <span className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                  STUDENT MENU
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Summary */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-black text-xl shadow-xs ${
              isAdmin 
                ? 'bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-700' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-slate-300 dark:border-slate-700'
            }`}>
              <User className={`w-8 h-8 ${isAdmin ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'}`} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                {user?.name || (isAdmin ? 'Manika Maheshwari' : 'Monisha K P')}
              </h3>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block pt-0.5">
                {isAdmin ? (
                  <span className="text-purple-700 dark:text-purple-300 font-extrabold">Senior Faculty & Admin</span>
                ) : (
                  <>Organization Code <strong className="text-slate-800 dark:text-white">JOSHVZ</strong></>
                )}
              </span>
            </div>
          </div>

          {/* Menu Items List - Role Differentiated */}
          <div className="space-y-1 text-xs font-extrabold text-slate-700 dark:text-slate-300">
            
            {isAdmin ? (
              /* ================= ADMIN CONTROL MENU ITEMS ================= */
              <>
                {/* 1. Admin Command Center */}
                <Link
                  to="/"
                  onClick={onClose}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-900 dark:text-purple-300 transition-colors border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-purple-700 dark:text-purple-400" />
                    <span className="font-black">Admin Command Center</span>
                  </div>
                  <span className="bg-purple-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase shadow-xs">ADMIN</span>
                </Link>

                {/* 2. Doubts Inbox & Chat Desk */}
                <Link
                  to="/chats"
                  onClick={onClose}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-[#0284C7] dark:text-sky-400" />
                    <span className="text-slate-900 dark:text-white">Doubts Inbox & Chat Desk</span>
                  </div>
                </Link>

                {/* 3. Course & Content Catalog */}
                <Link
                  to="/store"
                  onClick={onClose}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                    <span className="text-slate-900 dark:text-white">Course & Content Management</span>
                  </div>
                </Link>

                {/* 4. Common Leaderboard */}
                <Link
                  to="/leaderboard"
                  onClick={onClose}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                    <span className="text-slate-900 dark:text-white">Common Leaderboard</span>
                  </div>
                </Link>

                {/* 5. Edit Profile */}
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Edit3 className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-900 dark:text-white">Faculty Profile Settings</span>
                  </div>
                </Link>

                {/* 6. Platform Settings */}
                <button
                  onClick={() => setModalType('settings')}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-900 dark:text-white">Platform Settings</span>
                  </div>
                </button>
              </>
            ) : (
              /* ================= STUDENT MENU ITEMS ================= */
              <>
                {/* 1. Student Home */}
                <Link
                  to="/"
                  onClick={onClose}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-[#0284C7] dark:text-sky-400" />
                    <span className="text-slate-900 dark:text-white">Home Dashboard</span>
                  </div>
                </Link>

                {/* 2. Course Catalog (Maths) */}
                <Link
                  to="/store"
                  onClick={onClose}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                    <span className="text-slate-900 dark:text-white">Course Catalog (Maths)</span>
                  </div>
                </Link>

                {/* 3. Ask Doubts */}
                <Link
                  to="/chats"
                  onClick={onClose}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-[#0284C7] dark:text-sky-400" />
                    <span className="text-slate-900 dark:text-white">Ask Doubts (Manika Ma'am)</span>
                  </div>
                </Link>

                {/* 4. Offline Downloads */}
                <Link
                  to="/downloads"
                  onClick={onClose}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-900 dark:text-white">Offline Downloads</span>
                  </div>
                  <span className="bg-rose-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase shadow-xs">NEW</span>
                </Link>

                {/* 5. Free Material */}
                <Link
                  to="/free-test"
                  onClick={onClose}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-900 dark:text-white">Free Material & Tests</span>
                  </div>
                </Link>

                {/* 6. Students Testimonial */}
                <button
                  onClick={() => setModalType('testimonials')}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-900 dark:text-white">Students Testimonial</span>
                  </div>
                </button>

                {/* 7. Edit Profile */}
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Edit3 className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-900 dark:text-white">Edit Profile</span>
                  </div>
                </Link>

                {/* 8. Settings */}
                <button
                  onClick={() => setModalType('settings')}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-900 dark:text-white">Settings</span>
                  </div>
                </button>

                {/* 9. How to use App */}
                <button
                  onClick={() => setModalType('guide')}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-900 dark:text-white">How to use App</span>
                  </div>
                </button>

                {/* 10. Privacy Policy */}
                <Link
                  to="/legal/privacy"
                  onClick={onClose}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-900 dark:text-white">Privacy Policy</span>
                  </div>
                </Link>

                {/* 11. Share App */}
                <button
                  onClick={handleShareApp}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Share2 className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-900 dark:text-white">Share App</span>
                  </div>
                </button>
              </>
            )}

          </div>
        </div>

        {/* Footer Actions: Sign Out / Sign In */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {user ? (
            <button
              onClick={() => { logout(); onClose(); navigate('/'); }}
              className="w-full py-3.5 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => { onClose(); if (onOpenAuthModal) onOpenAuthModal(); }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-[#0284C7] hover:from-sky-600 hover:to-sky-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <span>Sign In / Student Login</span>
            </button>
          )}
        </div>

      </div>

      {/* Pop-up Modals for Student Menu Items */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            {modalType === 'testimonials' && (
              <div className="space-y-3">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Student Testimonials</h3>
                <p className="text-xs font-extrabold text-slate-600 dark:text-slate-400 leading-relaxed">
                  "Manika Ma'am's concept videos and chapterwise MCQs helped me score 98% in Class 10 Board Maths!" — Ananya R.
                </p>
              </div>
            )}

            {modalType === 'settings' && (
              <div className="space-y-3">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">App Settings</h3>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 space-y-2">
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span>App Version</span>
                    <span className="font-mono">v1.0.4</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Push Notifications</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">ENABLED</span>
                  </div>
                </div>
              </div>
            )}

            {modalType === 'guide' && (
              <div className="space-y-3">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">How to Use Sarvottam Diksha App</h3>
                <ol className="text-xs font-bold text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal pl-4">
                  <li>Select your Class (Grade 8 to 12).</li>
                  <li>Watch concept video lessons and download formula sheets.</li>
                  <li>Practice timed chapterwise MCQs to test your preparation.</li>
                  <li>Ask doubts directly to Manika Ma'am via the Chats section.</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
