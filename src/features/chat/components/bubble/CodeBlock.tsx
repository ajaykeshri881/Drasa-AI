import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CodeBlock({ match, codeString, className, children, props }: any) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden my-4 border border-border dark:border-[#33312E] shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/80 dark:bg-[#262523] border-b border-border dark:border-[#33312E]">
        <span className="text-[12px] font-medium text-muted-foreground dark:text-[#8A8985] font-mono lowercase">{match ? match[1] : 'text'}</span>
        <button 
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground dark:text-[#8A8985] dark:hover:text-[#E6E4DF] transition-colors p-1.5 rounded-md hover:bg-background dark:hover:bg-[#32302D] flex items-center gap-1.5"
          title="Copy code"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          <span className={`text-[11px] font-medium transition-opacity ${copied ? 'opacity-100 text-green-500' : 'opacity-0 group-hover:opacity-100'}`}>
            {copied ? 'Copied!' : 'Copy'}
          </span>
        </button>
      </div>
      <div className="p-4 bg-card dark:bg-[#1A1918] overflow-x-auto text-[13px] font-mono leading-relaxed custom-scrollbar">
        <code className={className} {...props}>
          {children}
        </code>
      </div>
    </div>
  );
}
