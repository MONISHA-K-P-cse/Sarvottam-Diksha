import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * MathRenderer: Robust KaTeX renderer component that parses:
 * 1. Inline LaTeX ($...$) and block LaTeX ($$...$$)
 * 2. Unwrapped TeX snippets (\frac{a}{b}, \sqrt{x}, x^2, etc.)
 * 3. Standard text with unicode math symbols (α, β, ∫, √, etc.)
 */
export default function MathRenderer({ text = '', className = '', inline = false }) {
  const renderedContent = useMemo(() => {
    if (!text || typeof text !== 'string') return '';

    try {
      // Check if text contains explicit LaTeX delimiters ($...$ or $$...$$)
      const hasDelimiters = text.includes('$') || text.includes('\\(') || text.includes('\\[');

      if (hasDelimiters) {
        // Tokenize and render parts
        const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);
        
        return parts.map((part, index) => {
          if (!part) return null;

          if (part.startsWith('$$') && part.endsWith('$$')) {
            const math = part.slice(2, -2).trim();
            const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="my-2 block text-center" />;
          }

          if (part.startsWith('\\[') && part.endsWith('\\]')) {
            const math = part.slice(2, -2).trim();
            const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="my-2 block text-center" />;
          }

          if (part.startsWith('$') && part.endsWith('$')) {
            const math = part.slice(1, -1).trim();
            const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          }

          if (part.startsWith('\\(') && part.endsWith('\\)')) {
            const math = part.slice(2, -2).trim();
            const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          }

          return <span key={index}>{part}</span>;
        });
      }

      // If string contains TeX macros (\frac, \sqrt, \int, \begin, etc.), render as math directly
      const containsTexMacro = /\\(frac|sqrt|int|sum|prod|lim|begin|alpha|beta|gamma|delta|theta|pi|sigma|omega|vec|hat|bar)/i.test(text);

      if (containsTexMacro) {
        const html = katex.renderToString(text, { displayMode: !inline, throwOnError: false });
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
      }

      // Standard text with possible unicode math symbols
      return <span>{text}</span>;
    } catch (e) {
      return <span>{text}</span>;
    }
  }, [text, inline]);

  if (!text) return null;

  const WrapperTag = inline ? 'span' : 'div';

  return (
    <WrapperTag className={`math-renderer ${className}`}>
      {renderedContent}
    </WrapperTag>
  );
}
