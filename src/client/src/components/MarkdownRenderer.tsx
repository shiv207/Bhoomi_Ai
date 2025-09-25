import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type LLMOutputComponent } from '@llm-ui/react';
import './MarkdownRenderer.css';

// Custom neumorphic styled markdown component
const MarkdownComponent: LLMOutputComponent = ({ blockMatch }: { blockMatch: any }) => {
  const markdown = blockMatch.output;

  return (
    <div className="neu-markdown-container">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings with neumorphic styling
          h1: ({ children }) => (
            <h1 className="neu-markdown-h1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="neu-markdown-h2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="neu-markdown-h3">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="neu-markdown-h4">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="neu-markdown-h5">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="neu-markdown-h6">{children}</h6>
          ),
          
          // Paragraphs
          p: ({ children }) => (
            <p className="neu-markdown-p">{children}</p>
          ),
          
          // Lists
          ul: ({ children }) => (
            <ul className="neu-markdown-ul">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="neu-markdown-ol">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="neu-markdown-li">{children}</li>
          ),
          
          // Links
          a: ({ href, children }) => (
            <a href={href} className="neu-markdown-link" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          
          // Inline code
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const inline = !match;
            
            return !inline && match ? (
              <div className="neu-code-block">
                <pre className="neu-markdown-pre">
                  <code className="neu-markdown-code" {...props}>
                    {String(children).replace(/\n$/, '')}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="neu-markdown-inline-code" {...props}>
                {children}
              </code>
            );
          },
          
          // Tables
          table: ({ children }) => (
            <div className="neu-markdown-table-container">
              <table className="neu-markdown-table">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="neu-markdown-thead">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="neu-markdown-tbody">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="neu-markdown-tr">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="neu-markdown-th">{children}</th>
          ),
          td: ({ children }) => (
            <td className="neu-markdown-td">{children}</td>
          ),
          
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="neu-markdown-blockquote">{children}</blockquote>
          ),
          
          // Horizontal rule
          hr: () => (
            <hr className="neu-markdown-hr" />
          ),
          
          // Strong and emphasis
          strong: ({ children }) => (
            <strong className="neu-markdown-strong">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="neu-markdown-em">{children}</em>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownComponent;
