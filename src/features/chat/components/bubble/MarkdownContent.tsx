import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  if (!content) return null;

  return (
    <div className="prose dark:prose-invert max-w-none break-words text-[15px] leading-relaxed text-foreground/90 dark:text-[#D4D2CD] prose-p:leading-relaxed prose-p:last:mb-0 mb-0">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const isBlock = Boolean(match);
            
            if (isBlock) {
              const codeString = String(children).replace(/\n$/, '');
              return (
                <CodeBlock match={match} codeString={codeString} className={className} props={props}>
                  {children}
                </CodeBlock>
              );
            }
            return (
              <code className="bg-muted dark:bg-[#262523] px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-border/50 dark:border-[#33312E]/50 text-foreground dark:text-[#E6E4DF]" {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
