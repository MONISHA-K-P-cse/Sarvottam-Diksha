import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home as HomeIcon, BookOpen, MessageSquare, User } from 'lucide-react';

export default function BottomNav({ onOpenAuthModal }) {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleNavClick = (e, path) => {
    if (!user) {
      e.preventDefault();
      if (onOpenAuthModal) onOpenAuthModal();
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg px-4 py-2 flex items-center justify-around transition-colors">
      
      {/* 1. Home */}
      <Link
        to="/"
        onClick={(e) => handleNavClick(e, '/')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          isActive('/') ? 'text-[#0284C7] dark:text-sky-400 font-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
        }`}
      >
        <HomeIcon className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </Link>

      {/* 2. Store */}
      <Link
        to="/store"
        onClick={(e) => handleNavClick(e, '/store')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          isActive('/store') ? 'text-[#0284C7] dark:text-sky-400 font-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
        }`}
      >
        <BookOpen className="w-5 h-5" />
        <span className="text-[10px]">Store</span>
      </Link>

      {/* 3. Chats */}
      <Link
        to="/chats"
        onClick={(e) => handleNavClick(e, '/chats')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          isActive('/chats') ? 'text-[#0284C7] dark:text-sky-400 font-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
        }`}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-[10px]">Chats</span>
      </Link>

      {/* 4. Profile */}
      <Link
        to="/profile"
        onClick={(e) => handleNavClick(e, '/profile')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          isActive('/profile') ? 'text-[#0284C7] dark:text-sky-400 font-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[10px]">Profile</span>
      </Link>

    </div>
  );
}
