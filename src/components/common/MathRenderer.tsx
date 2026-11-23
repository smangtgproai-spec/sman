/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  block?: boolean;
}

/**
 * Safely renders text that contains inline ($...$) or block ($$...$$) LaTeX expressions,
 * or standard math/physics/chemistry notation.
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  block = false,
}) => {
  // Parse content for LaTeX delimiters $$...$$ and $...$
  const renderedContent = useMemo(() => {
    if (!content) return null;

    // Check if the entire string is meant to be rendered as block math
    if (block) {
      try {
        const cleanContent = content.replace(/^\$\$|\$\$$/g, '').trim();
        const html = katex.renderToString(cleanContent, {
          displayMode: true,
          throwOnError: false,
        });
        return <div dangerouslySetInnerHTML={{ __html: html }} className={className} />;
      } catch (err) {
        return <div className={className}>{content}</div>;
      }
    }

    // Split text by block ($$...$$) and inline ($...$) math
    // Matches $$...$$ or $...$
    const regex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g;
    const parts = content.split(regex);

    return (
      <span className={className}>
        {parts.map((part, index) => {
          if (!part) return null;

          // Block formula $$...$$
          if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
            const math = part.slice(2, -2).trim();
            try {
              const html = katex.renderToString(math, {
                displayMode: true,
                throwOnError: false,
              });
              return (
                <span
                  key={index}
                  className="my-2 block overflow-x-auto text-center"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            } catch {
              return <span key={index} className="font-mono text-slate-800">{part}</span>;
            }
          }

          // Inline formula $...$
          if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
            const math = part.slice(1, -1).trim();
            try {
              const html = katex.renderToString(math, {
                displayMode: false,
                throwOnError: false,
              });
              return (
                <span
                  key={index}
                  className="inline-math px-0.5"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            } catch {
              return <span key={index} className="font-mono text-slate-800">{part}</span>;
            }
          }

          // Regular text (may have newlines)
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </span>
    );
  }, [content, className, block]);

  return <>{renderedContent}</>;
};
