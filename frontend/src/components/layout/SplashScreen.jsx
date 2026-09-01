import React, { useState, useEffect, useRef } from 'react';
import logoImg from '../../assets/logo.png';
import { Sparkles, GraduationCap } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  const [fade, setFade] = useState(false);
  const [progress, setProgress] = useState(0);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    // Progress bar animation
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 5;
      });
    }, 50);

    // Fade out timer
    const fadeTimer = setTimeout(() => {
      setFade(true);
    }, 1200);

    // Dismiss timer
    const dismissTimer = setTimeout(() => {
      if (onFinishRef.current) onFinishRef.current();
    }, 1500);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-b from-white via-orange-50/50 to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-6 transition-opacity duration-500 ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="max-w-md w-full text-center space-y-8 flex flex-col items-center animate-fade-in">
        
        {/* Animated Brand Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 text-xs font-black text-orange-700 dark:text-orange-300 shadow-xs">
          <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400 animate-spin" />
          <span>Official Tuition Platform</span>
        </div>

        {/* Large Prominent Logo Image */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-orange-400 to-sky-400 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
          <div className="relative bg-white dark:bg-slate-800 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl flex items-center justify-center">
            <img
              src={logoImg}
              alt="Sarvottam Diksha Logo"
              className="h-28 sm:h-36 w-auto object-contain transform hover:scale-105 transition-transform"
            />
          </div>
        </div>

        {/* Brand Tagline */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Sarvottam Diksha</h2>
          <p className="text-sm font-extrabold text-[#0284C7] dark:text-sky-400 flex items-center justify-center gap-1.5">
            <GraduationCap className="w-4 h-4" /> Delve in concepts with MANIKA
          </p>
        </div>

        {/* Animated Loading Bar */}
        <div className="w-64 space-y-2">
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700">
            <div
              className="bg-gradient-to-r from-orange-500 to-[#0284C7] h-full rounded-full transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
            Loading App... {progress}%
          </span>
        </div>

      </div>
    </div>
  );
}
