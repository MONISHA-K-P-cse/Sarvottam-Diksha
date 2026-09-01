import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function IntegralModal({ isOpen, onClose, onInsert, initialData = null }) {
  const [lowerLimit, setLowerLimit] = useState(initialData?.lowerLimit || '0');
  const [upperLimit, setUpperLimit] = useState(initialData?.upperLimit || '1');
  const [expression, setExpression] = useState(initialData?.expression || 'x^2');
  const [variable, setVariable] = useState(initialData?.variable || 'x');

  if (!isOpen) return null;

  const handleInsert = () => {
    const a = lowerLimit.trim();
    const b = upperLimit.trim();
    const f = expression.trim() || 'x';
    const v = variable.trim() || 'x';

    let snippet = '';
    if (a || b) {
      snippet = `$\\int_{${a}}^{${b}} ${f} d${v}$`;
    } else {
      snippet = `$\\int ${f} d${v}$`;
    }

    onInsert(snippet);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h4 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
            <span>∫ Visual Calculus Integral Builder</span>
          </h4>
          <button type="button" onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                Lower Limit (a)
              </label>
              <input
                type="text"
                value={lowerLimit}
                onChange={(e) => setLowerLimit(e.target.value)}
                placeholder="e.g. 0 or -∞"
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                Upper Limit (b)
              </label>
              <input
                type="text"
                value={upperLimit}
                onChange={(e) => setUpperLimit(e.target.value)}
                placeholder="e.g. 1 or ∞"
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
              Integrand Function f(x)
            </label>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="e.g. x^2 or sin(x)"
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
              Differential Variable (d/d_)
            </label>
            <input
              type="text"
              value={variable}
              onChange={(e) => setVariable(e.target.value)}
              placeholder="e.g. x or t or θ"
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-sky-500"
            />
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
            <span>Insert Integral</span>
          </button>
        </div>
      </div>
    </div>
  );
}
