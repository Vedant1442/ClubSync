import React from 'react'
import ReactMarkdown from 'react-markdown'

export default function FormattedMessage({ content, isUser }) {
  if (isUser) {
    return <div className="whitespace-pre-wrap">{content}</div>
  }

  // Fallback if content is empty
  if (!content) return null

  return (
    <div className="space-y-1.5 text-xs leading-relaxed text-text dark:text-zinc-200">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-sm font-bold mt-2 mb-1 text-text" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xs font-bold mt-2 mb-1 text-text" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-xs font-semibold mt-1.5 mb-1 text-primary" {...props} />,
          p: ({ node, ...props }) => <p className="mb-1 leading-relaxed" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-text dark:text-white" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 my-1.5" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1 my-1.5" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-2 border-primary/50 pl-2.5 py-0.5 my-1.5 text-text-secondary italic bg-primary/5 rounded-r" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-2 rounded-lg border border-border">
              <table className="w-full text-left border-collapse text-[11px]" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => <th className="bg-surface-dim p-2 font-bold border-b border-border text-text" {...props} />,
          td: ({ node, ...props }) => <td className="p-2 border-b border-border/50 text-text" {...props} />,
          code: ({ node, inline, ...props }) => (
            inline
              ? <code className="bg-surface-dim px-1.5 py-0.5 rounded text-[11px] font-mono text-primary font-medium" {...props} />
              : <code className="block bg-surface-dim p-2.5 rounded-lg text-[11px] font-mono overflow-x-auto my-1.5 border border-border" {...props} />
          ),
          a: ({ node, ...props }) => <a className="text-primary underline font-medium hover:text-primary-dark" target="_blank" rel="noreferrer" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
