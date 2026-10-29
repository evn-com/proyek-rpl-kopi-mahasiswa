'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
  variant?: 'default' | 'dark' | 'admin';
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  isStreaming = false,
  variant = 'default',
}) => {
  // Styling berdasarkan variant tampilan (dark/cream/admin)
  const strongClass =
    variant === 'dark'
      ? 'font-bold text-amber-300'
      : variant === 'admin'
      ? 'font-bold text-violet-300'
      : 'font-bold text-coffee-950 dark:text-amber-300';

  const headingClass =
    variant === 'dark'
      ? 'text-amber-200 font-extrabold'
      : variant === 'admin'
      ? 'text-violet-200 font-extrabold'
      : 'text-coffee-950 dark:text-amber-300 font-extrabold';

  const inlineCodeClass =
    variant === 'dark'
      ? 'bg-black/40 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold'
      : variant === 'admin'
      ? 'bg-slate-950/60 text-violet-300 border border-violet-500/20 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold'
      : 'bg-coffee-900/10 dark:bg-black/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold';

  const blockquoteClass =
    variant === 'dark'
      ? 'border-l-2 border-amber-400 pl-3 my-2.5 italic text-coffee-200'
      : variant === 'admin'
      ? 'border-l-2 border-violet-400 pl-3 my-2.5 italic text-slate-300'
      : 'border-l-2 border-amber-500/60 pl-3 my-2.5 italic text-coffee-700 dark:text-coffee-300';

  return (
    <div className={`markdown-content text-inherit leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed font-normal">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className={`font-bold tracking-tight ${strongClass}`}>
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 space-y-1.5 my-2.5 last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-5 space-y-1.5 my-2.5 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-0.5 leading-relaxed">{children}</li>
          ),
          h1: ({ children }) => (
            <h1 className={`text-base mb-2 mt-3.5 first:mt-0 ${headingClass}`}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={`text-sm mb-2 mt-3 first:mt-0 ${headingClass}`}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={`text-xs sm:text-sm mb-1.5 mt-2.5 first:mt-0 ${headingClass}`}>
              {children}
            </h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className={blockquoteClass}>
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children }: any) => {
            const isCodeBlock = codeClassName?.includes('language-') || String(children).includes('\n');
            return !isCodeBlock ? (
              <code className={inlineCodeClass}>
                {children}
              </code>
            ) : (
              <code className="block bg-coffee-950 dark:bg-black/90 text-amber-200 p-3 rounded-xl text-xs font-mono my-2.5 overflow-x-auto border border-coffee-800/60 dark:border-espresso-border">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full text-left text-xs border border-coffee-300 dark:border-espresso-border rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-coffee-300 dark:border-espresso-border bg-coffee-100/60 dark:bg-white/10 p-2 font-bold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-coffee-200 dark:border-espresso-border/50 p-2">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 ml-1 bg-amber-500 animate-pulse align-middle rounded-xs" />
      )}
    </div>
  );
};

export default MarkdownRenderer;
