import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface FormattedMessageProps {
  content: string;
  isAssistant?: boolean;
}

interface CodeComponentProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function FormattedMessage({ content, isAssistant = false }: FormattedMessageProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>
        ),
        
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-2 leading-relaxed">{children}</p>
        ),
        
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {children}
          </a>
        ),
        
        // Code blocks
        code: ({ inline, className, children }: CodeComponentProps) => {
          if (inline) {
            return (
              <code className="bg-slate-700 text-slate-100 px-2 py-1 rounded text-xs font-mono">
                {children}
              </code>
            );
          }
          return (
            <CodeBlock className={className} content={String(children)} />
          );
        },
        
        // Inline code
        pre: ({ children }) => (
          <div className="bg-slate-800 rounded-lg overflow-hidden my-3">
            {children}
          </div>
        ),
        
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 ml-2 space-y-1">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 ml-2 space-y-1">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-sm">{children}</li>
        ),
        
        // Block quotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-slate-500 pl-4 italic my-2 text-slate-300">
            {children}
          </blockquote>
        ),
        
        // Horizontal rule
        hr: () => (
          <hr className="my-4 border-slate-600" />
        ),
        
        // Tables
        table: ({ children }) => (
          <table className="border-collapse border border-slate-600 my-3 text-sm">
            {children}
          </table>
        ),
        thead: ({ children }) => (
          <thead className="bg-slate-700">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody>{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr className="border border-slate-600">{children}</tr>
        ),
        td: ({ children }) => (
          <td className="border border-slate-600 px-3 py-2">{children}</td>
        ),
        th: ({ children }) => (
          <th className="border border-slate-600 px-3 py-2 text-left font-bold">{children}</th>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function CodeBlock({ className, content }: { className?: string; content: string }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace(/language-/, '') || 'text';

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-slate-800 rounded-lg my-3">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-700 border-b border-slate-600">
        <span className="text-xs text-slate-300 font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-slate-300 hover:text-slate-100 transition-colors flex items-center gap-1"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4">
        <code className="text-sm text-slate-100 font-mono leading-relaxed">
          {content.trim()}
        </code>
      </pre>
    </div>
  );
}
