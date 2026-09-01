import React, { useState } from 'react';
import { X, Check, Superscript } from 'lucide-react';

export default function PowerRootModal({ isOpen, onClose, onInsert, initialData = null }) {
  const [mode, setMode] = useState(initialData?.mode || 'power'); // 'power' or 'root'
  const [base, setBase] = useState(initialData?.base || 'x');
  const [expOrIndex, setExpOrIndex] = useState(initialData?.expOrIndex || '2');

  if (!isOpen) return null;

  const handleInsert = () => {
    const b = base.trim() || 'x';
    const val = expOrIndex.trim() || '2';

    let snippet = '';
    if (mode === 'power') {
      snippet = `$${b}^{${val}}$`;
    } else {
      snippet = `$\\sqrt[${val}]{${b}}$`;
    }

    onInsert(snippet);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h4 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Superscript className="w-5 h-5 text-sky-500" />
            <span>Visual Power & Root Builder</span>
          </h4>
          <button type="button" onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setMode('power')}
            className={`py-2 text-xs font-black rounded-xl transition-all ${
              mode === 'power'
                ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Exponent / Power (xⁿ)
          </button>
          <button
            type="button"
            onClick={() => setMode('root')}
            className={`py-2 text-xs font-black rounded-xl transition-all ${
              mode === 'root'
                ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Root (ⁿ√x)
          </button>
        </div>

        <div className="space-y-3 py-2">
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
              Base Expression (Inside / Underneath)
            </label>
            <input
              type="text"
              value={base}
              onChange={(e) => setBase(e.target.value)}
              placeholder="e.g. x + 2 or a"
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
              {mode === 'power' ? 'Exponent Value (Power n)' : 'Root Index (e.g. 2 for √, 3 for ∛)'}
            </label>
            <input
              type="text"
              value={expOrIndex}
              onChange={(e) => setExpOrIndex(e.target.value)}
              placeholder={mode === 'power' ? 'e.g. 2 or n' : 'e.g. 3 or n'}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-sky-500"
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
            <span>Apply Visual Expression</span>
          </button>
        </div>
      </div>
    </div>
  );
}
