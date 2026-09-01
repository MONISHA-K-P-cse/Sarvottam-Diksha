import React from 'react';
import { Download, HardDrive, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Downloads() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-black text-white">My Downloads (0)</h1>
        </div>
        <span className="text-xs font-black bg-white/20 px-3.5 py-1.5 rounded-full uppercase tracking-wider">STORAGE</span>
      </div>

      {/* Empty State Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 max-w-lg mx-auto my-12 transition-colors">
        <div className="w-24 h-24 mx-auto rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center shadow-md">
          <Download className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">No offline content found!</h2>
          <p className="text-xs sm:text-sm font-extrabold text-slate-600 dark:text-slate-400 leading-relaxed">
            You don’t have any downloaded contents. Your offline formula handbooks and PDF revision notes will be listed here.
          </p>
        </div>

        <Link
          to="/free-resources"
          className="inline-block px-6 py-3.5 rounded-xl font-black text-xs text-white bg-orange-500 hover:bg-orange-600 shadow-md transition-all active:scale-95"
        >
          Browse Free Formula PDFs
        </Link>
      </div>

    </div>
  );
}
