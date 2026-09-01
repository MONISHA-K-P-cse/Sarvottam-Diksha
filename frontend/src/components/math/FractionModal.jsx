import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import MathRenderer from './MathRenderer';

export default function FractionModal({ isOpen, onClose, onInsert, initialData = null }) {
  const [numerator, setNumerator] = useState('a');
  const [denominator, setDenominator] = useState('b');

  useEffect(() => {
    if (initialData) {
      if (initialData.numerator) setNumerator(initialData.numerator);
      if (initialData.denominator) setDenominator(initialData.denominator);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const currentLatex = `$\\frac{${numerator.trim() || 'a'}}{${denominator.trim() || 'b'}}$`;

  const handleInsert = () => {
    onInsert(currentLatex);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h4 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
            <span>½ Visual Fraction Builder</span>
          </h4>
          <button type="button" onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 py-2">
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
              Numerator (Top Value)
            </label>
            <input
              type="text"
              value={numerator}
              onChange={(e) => setNumerator(e.target.value)}
              placeholder="e.g. x + 2 or a"
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-sky-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-sky-500 shadow-2xs"
            />
          </div>

          <div className="flex justify-center my-1">
            <div className="w-full border-b-2 border-slate-300 dark:border-slate-700 max-w-xs" />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
              Denominator (Bottom Value)
            </label>
            <input
              type="text"
              value={denominator}
              onChange={(e) => setDenominator(e.target.value)}
              placeholder="e.g. x - 2 or b"
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-sky-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-sky-500 shadow-2xs"
            />
          </div>

          {/* Live Rendered Fraction Preview */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-1">
            <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
              ✨ Live Formatted Fraction Preview:
            </span>
            <div className="text-base font-extrabold text-slate-900 dark:text-white py-1">
              <MathRenderer text={currentLatex} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply Fraction</span>
          </button>
        </div>
      </div>
    </div>
  );
}
