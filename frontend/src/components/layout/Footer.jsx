import React from 'react';
import { Link } from 'react-router-dom';
import { useBranding } from '../../context/BrandingContext';
import logoImg from '../../assets/logo.png';
import logoDarkImg from '../../assets/logo-dark.png';
import { Mail, Phone, MapPin, Shield, FileCheck, RefreshCw, Heart } from 'lucide-react';

export default function Footer() {
  const { branding } = useBranding();

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 pt-16 pb-8 text-slate-700 dark:text-slate-300 text-sm transition-colors duration-300 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-200 dark:border-slate-800">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <img 
                src={logoImg} 
                alt="Sarvottam Diksha Official Logo" 
                className="h-12 w-auto object-contain dark:hidden block"
              />
              <img 
                src={logoDarkImg} 
                alt="Sarvottam Diksha Official Logo" 
                className="h-12 w-auto object-contain hidden dark:block"
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-extrabold leading-relaxed">
              Empowering Class 8 to 12 students with concept-driven video lectures, curated formula notes, and chapterwise MCQ practice test series under the mentorship of Manika Ma'am.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">Quick Navigation</h4>
            <ul className="space-y-2.5 text-xs font-extrabold">
              <li>
                <Link to="/" className="text-slate-700 dark:text-slate-300 hover:text-[#0284C7] dark:hover:text-sky-400 transition-colors">
                  Home & Overview
                </Link>
              </li>
              <li>
                <Link to="/store" className="text-slate-700 dark:text-slate-300 hover:text-[#0284C7] dark:hover:text-sky-400 transition-colors">
                  All Online Courses
                </Link>
              </li>
              <li>
                <Link to="/free-test" className="text-slate-700 dark:text-slate-300 hover:text-[#0284C7] dark:hover:text-sky-400 transition-colors">
                  Free Study Material & Formula Sheets
                </Link>
              </li>
              <li>
                <Link to="/my-courses" className="text-slate-700 dark:text-slate-300 hover:text-[#0284C7] dark:hover:text-sky-400 transition-colors">
                  Enrolled Student Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">Legal & Policies</h4>
            <ul className="space-y-2.5 text-xs font-extrabold">
              <li>
                <Link to="/legal/privacy" className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-[#0284C7] dark:hover:text-sky-400 transition-colors">
                  <Shield className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/terms" className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-[#0284C7] dark:hover:text-sky-400 transition-colors">
                  <FileCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/legal/refund" className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-[#0284C7] dark:hover:text-sky-400 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  Refund & Cancellation Policy
                </Link>
              </li>
              <li>
                <Link to="/chats" className="text-slate-700 dark:text-slate-300 hover:text-[#0284C7] dark:hover:text-sky-400 transition-colors">
                  Contact & Student Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">Contact Info</h4>
            <ul className="space-y-3 text-xs font-extrabold">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">{branding.contactPhone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FF6500] dark:text-orange-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">{branding.contactEmail}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-black text-slate-600 dark:text-slate-400">
          <p>© {new Date().getFullYear()} {branding.appName}. All rights reserved. 100% Teacher-Owned.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Manika Ma'am & Students
          </p>
        </div>
      </div>
    </footer>
  );
}
