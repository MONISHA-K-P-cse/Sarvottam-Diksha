import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import MathRenderer from './MathRenderer';

export default function MatrixModal({ isOpen, onClose, onInsert, initialData = null }) {
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [matrixData, setMatrixData] = useState([
    ['1', '2'],
    ['3', '4']
  ]);
  const [bracketType, setBracketType] = useState('bmatrix'); // pmatrix (), bmatrix [], vmatrix ||

  useEffect(() => {
    if (initialData) {
      if (initialData.rows) setRows(initialData.rows);
      if (initialData.cols) setCols(initialData.cols);
      if (initialData.matrixData) setMatrixData(initialData.matrixData);
      if (initialData.bracketType) setBracketType(initialData.bracketType);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleDimensionChange = (newRows, newCols) => {
    const r = Math.max(1, Math.min(5, newRows));
    const c = Math.max(1, Math.min(5, newCols));
    setRows(r);
    setCols(c);

    const newData = [];
    for (let i = 0; i < r; i++) {
      const row = [];
      for (let j = 0; j < c; j++) {
        row.push(matrixData[i]?.[j] || `${i * c + j + 1}`);
      }
      newData.push(row);
    }
    setMatrixData(newData);
  };

  const handleCellChange = (rIdx, cIdx, val) => {
    const updated = matrixData.map((row, r) =>
      row.map((cell, c) => (r === rIdx && c === cIdx ? val : cell))
    );
    setMatrixData(updated);
  };

  const currentLatex = `$\\begin{${bracketType}} ${matrixData.map(row => row.join(' & ')).join(' \\\\ ')} \\end{${bracketType}}$`;

  const handleInsert = () => {
    onInsert(currentLatex);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h4 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
            <span>[▫] Visual Matrix Grid Editor</span>
          </h4>
          <button type="button" onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-2">
          {/* Dimension selectors */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">Rows</label>
              <select
                value={rows}
                onChange={(e) => handleDimensionChange(parseInt(e.target.value), cols)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white font-bold text-xs"
              >
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Row{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">Columns</label>
              <select
                value={cols}
                onChange={(e) => handleDimensionChange(rows, parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white font-bold text-xs"
              >
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Col{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">Brackets</label>
              <select
                value={bracketType}
                onChange={(e) => setBracketType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white font-bold text-xs"
              >
                <option value="bmatrix">Brackets [ ]</option>
                <option value="pmatrix">Parentheses ( )</option>
                <option value="vmatrix">Determinant | |</option>
              </select>
            </div>
          </div>

          {/* Interactive Matrix Input Grid */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
              Type Values Directly into Matrix Cells:
            </span>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {matrixData.map((row, rIdx) =>
                row.map((cell, cIdx) => (
                  <input
                    key={`${rIdx}-${cIdx}`}
                    type="text"
                    value={cell}
                    onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                    placeholder={`r${rIdx+1}c${cIdx+1}`}
                    className="w-full bg-white dark:bg-slate-900 border-2 border-sky-300 dark:border-slate-700 rounded-xl p-2 text-center text-slate-900 dark:text-white font-mono text-sm font-black focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                ))
              )}
            </div>
          </div>

          {/* Live Visual Rendered Preview */}
          <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-1">
            <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
              ✨ Live Formatted Matrix Preview:
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
            <span>Save & Apply Matrix</span>
          </button>
        </div>
      </div>
    </div>
  );
}
