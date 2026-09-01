import React, { useState, useEffect, useMemo } from 'react';
import { Search, History, Calculator, ChevronDown, ChevronUp, Sparkles, Grid, Percent, Superscript, Edit2 } from 'lucide-react';
import FractionModal from './FractionModal';
import MatrixModal from './MatrixModal';
import PowerRootModal from './PowerRootModal';
import IntegralModal from './IntegralModal';

const ALL_MATH_CATEGORIES = [
  {
    id: 'basic',
    name: '1. Basic',
    symbols: [
      { display: '+', code: '+' },
      { display: '−', code: '-' },
      { display: '×', code: '×' },
      { display: '÷', code: '÷' },
      { display: '=', code: '=' },
      { display: '≠', code: '≠' },
      { display: '≈', code: '≈' },
      { display: '<', code: '<' },
      { display: '>', code: '>' },
      { display: '≤', code: '≤' },
      { display: '≥', code: '≥' },
      { display: '±', code: '±' },
      { display: '∞', code: '∞' },
      { display: '%', code: '%' }
    ]
  },
  {
    id: 'powers_roots',
    name: '2. Powers & Roots',
    isVisualTool: 'power_root',
    symbols: [
      { display: 'x²', code: 'x²' },
      { display: 'x³', code: 'x³' },
      { display: 'xⁿ (Power Editor)', isAction: 'power' },
      { display: '√x', code: '√x' },
      { display: '∛x', code: '∛x' },
      { display: 'ⁿ√x (Root Editor)', isAction: 'root' }
    ]
  },
  {
    id: 'fractions',
    name: '3. Fractions',
    isVisualTool: 'fraction',
    symbols: [
      { display: '½', code: '½' },
      { display: '⅓', code: '⅓' },
      { display: '¼', code: '¼' },
      { display: '¾', code: '¾' },
      { display: 'a/b (Fraction Builder)', isAction: 'fraction' }
    ]
  },
  {
    id: 'greek',
    name: '4. Greek Letters',
    symbols: [
      { display: 'α', code: 'α' },
      { display: 'β', code: 'β' },
      { display: 'γ', code: 'γ' },
      { display: 'δ', code: 'δ' },
      { display: 'ε', code: 'ε' },
      { display: 'θ', code: 'θ' },
      { display: 'λ', code: 'λ' },
      { display: 'μ', code: 'μ' },
      { display: 'π', code: 'π' },
      { display: 'ρ', code: 'ρ' },
      { display: 'σ', code: 'σ' },
      { display: 'φ', code: 'φ' },
      { display: 'ω', code: 'ω' },
      { display: 'Δ', code: 'Δ' },
      { display: 'Σ', code: 'Σ' },
      { display: 'Ω', code: 'Ω' }
    ]
  },
  {
    id: 'algebra',
    name: '5. Algebra',
    symbols: [
      { display: 'x', code: 'x' },
      { display: 'y', code: 'y' },
      { display: 'z', code: 'z' },
      { display: 'a²+b²', code: 'a²+b²' },
      { display: '(x+y)', code: '(x+y)' },
      { display: '|x|', code: '|x|' },
      { display: 'x² + 5x + 6 = 0', code: 'x² + 5x + 6 = 0' },
      { display: '√(x + 2)', code: '√(x + 2)' }
    ]
  },
  {
    id: 'geometry',
    name: '6. Geometry',
    symbols: [
      { display: '∠', code: '∠' },
      { display: '△', code: '△' },
      { display: '°', code: '°' },
      { display: '⊥', code: '⊥' },
      { display: '∥', code: '∥' },
      { display: '≅', code: '≅' },
      { display: 'radius (r)', code: 'r' },
      { display: 'diameter (d)', code: 'd' },
      { display: '∠ABC', code: '∠ABC' }
    ]
  },
  {
    id: 'trigonometry',
    name: '7. Trigonometry',
    symbols: [
      { display: 'sin', code: 'sin' },
      { display: 'cos', code: 'cos' },
      { display: 'tan', code: 'tan' },
      { display: 'cot', code: 'cot' },
      { display: 'sec', code: 'sec' },
      { display: 'cosec', code: 'cosec' },
      { display: 'sin²θ', code: 'sin²θ' },
      { display: 'cos²θ', code: 'cos²θ' },
      { display: 'tan⁻¹', code: 'tan⁻¹' },
      { display: 'θ', code: 'θ' }
    ]
  },
  {
    id: 'calculus',
    name: '8. Calculus',
    symbols: [
      { display: '∫', code: '∫' },
      { display: '∮', code: '∮' },
      { display: '∂', code: '∂' },
      { display: '∇', code: '∇' },
      { display: 'lim', code: 'lim' },
      { display: 'd/dx', code: 'd/dx' },
      { display: 'dy/dx', code: 'dy/dx' },
      { display: 'dx', code: 'dx' },
      { display: '∫ (Integral Editor)', isAction: 'integral' }
    ]
  },
  {
    id: 'sets',
    name: '9. Sets',
    symbols: [
      { display: '∈', code: '∈' },
      { display: '∉', code: '∉' },
      { display: '⊂', code: '⊂' },
      { display: '⊃', code: '⊃' },
      { display: '⊆', code: '⊆' },
      { display: '⊇', code: '⊇' },
      { display: '∪', code: '∪' },
      { display: '∩', code: '∩' },
      { display: '∅', code: '∅' },
      { display: 'ℕ', code: 'ℕ' },
      { display: 'ℤ', code: 'ℤ' },
      { display: 'ℚ', code: 'ℚ' },
      { display: 'ℝ', code: 'ℝ' }
    ]
  },
  {
    id: 'stats',
    name: '10. Stats & Probability',
    symbols: [
      { display: 'x̄', code: 'x̄' },
      { display: 'μ', code: 'μ' },
      { display: 'σ', code: 'σ' },
      { display: 'Σ', code: 'Σ' },
      { display: 'P(A)', code: 'P(A)' },
      { display: 'P(A|B)', code: 'P(A|B)' },
      { display: '%', code: '%' }
    ]
  },
  {
    id: 'logic',
    name: '11. Logic',
    symbols: [
      { display: '⇒', code: '⇒' },
      { display: '⇔', code: '⇔' },
      { display: '∀', code: '∀' },
      { display: '∃', code: '∃' },
      { display: '∴', code: '∴' },
      { display: '∵', code: '∵' }
    ]
  },
  {
    id: 'matrices',
    name: '12. Matrices',
    symbols: [
      { display: '[ 2×2 Matrix Editor ]', isAction: 'matrix' },
      { display: '( 3×3 Matrix Editor )', isAction: 'matrix' }
    ]
  },
  {
    id: 'tools',
    name: '13. Equation Tools',
    symbols: [
      { display: '½ Visual Fraction Builder', isAction: 'fraction' },
      { display: '[▫] Visual Matrix Builder', isAction: 'matrix' },
      { display: 'xⁿ Power / Root Builder', isAction: 'power' },
      { display: '∫ Calculus Integral Builder', isAction: 'integral' }
    ]
  }
];

export default function MathToolbar({ onInsert, targetInputRef, label = 'Math Keyboard', currentValue = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSymbols, setRecentSymbols] = useState([]);

  // Modal states
  const [isFractionModalOpen, setIsFractionModalOpen] = useState(false);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [isPowerModalOpen, setIsPowerModalOpen] = useState(false);
  const [isIntegralModalOpen, setIsIntegralModalOpen] = useState(false);

  // Edit states for pre-population
  const [editMatrixData, setEditMatrixData] = useState(null);
  const [editFractionData, setEditFractionData] = useState(null);

  // Load recently used symbols from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sarvottam_recent_math_symbols');
      if (saved) {
        setRecentSymbols(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const trackRecentSymbol = (symObj) => {
    if (!symObj.code) return;
    setRecentSymbols(prev => {
      const filtered = prev.filter(s => s.code !== symObj.code);
      const updated = [symObj, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('sarvottam_recent_math_symbols', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleInsertSnippet = (snippet) => {
    if (targetInputRef && targetInputRef.current) {
      const input = targetInputRef.current;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const original = input.value || '';
      
      const updated = original.slice(0, start) + snippet + original.slice(end);
      const newCursorPos = start + snippet.length;

      onInsert(updated, newCursorPos);

      setTimeout(() => {
        if (input.focus) input.focus();
        if (input.setSelectionRange) {
          input.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 50);
    } else {
      onInsert(snippet);
    }
  };

  const handleSymbolClick = (symObj) => {
    if (symObj.isAction === 'matrix') {
      setEditMatrixData(null);
      setIsMatrixModalOpen(true);
      return;
    }
    if (symObj.isAction === 'fraction') {
      setEditFractionData(null);
      setIsFractionModalOpen(true);
      return;
    }
    if (symObj.isAction === 'power' || symObj.isAction === 'root') {
      setIsPowerModalOpen(true);
      return;
    }
    if (symObj.isAction === 'integral') {
      setIsIntegralModalOpen(true);
      return;
    }

    if (symObj.code) {
      trackRecentSymbol(symObj);
      handleInsertSnippet(symObj.code);
    }
  };

  // Detect existing matrix/fraction in field value for 1-click edit
  const detectedMatrixMatch = useMemo(() => {
    if (!currentValue) return null;
    const match = currentValue.match(/\\begin\{(bmatrix|pmatrix|vmatrix)\}([\s\S]*?)\\end\{\1\}/);
    if (match) {
      const bracketType = match[1];
      const content = match[2].trim();
      const rowsRaw = content.split('\\\\');
      const matrixData = rowsRaw.map(r => r.split('&').map(cell => cell.trim()));
      const rows = matrixData.length;
      const cols = matrixData[0]?.length || 2;
      return { bracketType, matrixData, rows, cols, fullMatch: match[0] };
    }
    return null;
  }, [currentValue]);

  const detectedFractionMatch = useMemo(() => {
    if (!currentValue) return null;
    const match = currentValue.match(/\\frac\{([\s\S]*?)\}\{([\s\S]*?)\}/);
    if (match) {
      return { numerator: match[1], denominator: match[2], fullMatch: match[0] };
    }
    return null;
  }, [currentValue]);

  const handleEditDetectedMatrix = () => {
    if (detectedMatrixMatch) {
      setEditMatrixData(detectedMatrixMatch);
      setIsMatrixModalOpen(true);
    }
  };

  const handleEditDetectedFraction = () => {
    if (detectedFractionMatch) {
      setEditFractionData(detectedFractionMatch);
      setIsFractionModalOpen(true);
    }
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase().trim();
    const results = [];

    ALL_MATH_CATEGORIES.forEach(cat => {
      cat.symbols.forEach(sym => {
        if (
          sym.display.toLowerCase().includes(query) ||
          (sym.code && sym.code.toLowerCase().includes(query)) ||
          cat.name.toLowerCase().includes(query)
        ) {
          results.push({ ...sym, category: cat.name });
        }
      });
    });

    return results;
  }, [searchQuery]);

  const activeCategory = ALL_MATH_CATEGORIES.find(c => c.id === activeTab) || ALL_MATH_CATEGORIES[0];

  return (
    <div className="w-full my-1 font-sans">
      {/* Keyboard Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-1.5 shadow-2xs gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-all"
        >
          <Calculator className="w-4 h-4 text-sky-500" />
          <span>{label}</span>
          <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold px-2 py-0.5 rounded-full">
            Visual Math Tools
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Detected Equation Visual Edit Badges */}
          {detectedMatrixMatch && (
            <button
              type="button"
              onClick={handleEditDetectedMatrix}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer animate-pulse"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>✏️ Edit Matrix ({detectedMatrixMatch.rows}x{detectedMatrixMatch.cols})</span>
            </button>
          )}

          {detectedFractionMatch && (
            <button
              type="button"
              onClick={handleEditDetectedFraction}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer animate-pulse"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>✏️ Edit Fraction</span>
            </button>
          )}

          {/* Quick Visual Launchers */}
          <button
            type="button"
            onClick={() => {
              setEditFractionData(null);
              setIsFractionModalOpen(true);
            }}
            className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <span>½ Fraction</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditMatrixData(null);
              setIsMatrixModalOpen(true);
            }}
            className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5 text-indigo-500" />
            <span>Matrix Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPowerModalOpen(true)}
            className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <Superscript className="w-3.5 h-3.5 text-emerald-500" />
            <span>Power / Root</span>
          </button>
        </div>
      </div>

      {/* Expanded Keyboard Drawer */}
      {isOpen && (
        <div className="mt-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xl space-y-3 animate-in fade-in duration-150">
          
          {/* Search + Category Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search symbol (e.g. sqrt, sin, matrix, fraction)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
              <select
                value={activeTab}
                onChange={(e) => {
                  setActiveTab(e.target.value);
                  setSearchQuery('');
                }}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-black rounded-xl px-3 py-1.5 focus:outline-none"
              >
                {ALL_MATH_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recently Used Bar */}
          {recentSymbols.length > 0 && !searchQuery && (
            <div className="flex items-center gap-2 overflow-x-auto py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 shrink-0">
                <History className="w-3 h-3 text-amber-500" /> Recent:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto">
                {recentSymbols.map((sym, idx) => (
                  <button
                    key={`${sym.display}-${idx}`}
                    type="button"
                    onClick={() => handleSymbolClick(sym)}
                    className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100 rounded-lg text-xs font-mono font-black shrink-0 transition-all cursor-pointer"
                  >
                    {sym.display}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Buttons Panel */}
          <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded-2xl max-h-48 overflow-y-auto">
            {searchQuery ? (
              searchResults && searchResults.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {searchResults.map((sym, idx) => (
                    <button
                      key={`${sym.display}-${idx}`}
                      type="button"
                      onClick={() => handleSymbolClick(sym)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-xl text-xs font-mono font-black text-slate-900 dark:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>{sym.display}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 font-medium">
                  No math tools found for "{searchQuery}".
                </div>
              )
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {activeCategory.symbols.map((sym, idx) => (
                  <button
                    key={`${sym.display}-${idx}`}
                    type="button"
                    onClick={() => handleSymbolClick(sym)}
                    className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-xl text-xs font-mono font-black text-slate-900 dark:text-white transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center min-w-[38px]"
                  >
                    {sym.display}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual Modals */}
      <FractionModal
        isOpen={isFractionModalOpen}
        onClose={() => setIsFractionModalOpen(false)}
        initialData={editFractionData}
        onInsert={(snippet) => handleInsertSnippet(snippet)}
      />

      <MatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        initialData={editMatrixData}
        onInsert={(snippet) => handleInsertSnippet(snippet)}
      />

      <PowerRootModal
        isOpen={isPowerModalOpen}
        onClose={() => setIsPowerModalOpen(false)}
        onInsert={(snippet) => handleInsertSnippet(snippet)}
      />

      <IntegralModal
        isOpen={isIntegralModalOpen}
        onClose={() => setIsIntegralModalOpen(false)}
        onInsert={(snippet) => handleInsertSnippet(snippet)}
      />
    </div>
  );
}
