import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronRight, ChevronDown, Lightbulb, ExternalLink, X } from 'lucide-react';

interface ThinkingBlockProps {
  thinkingContent: string;
  activeSponsor?: any;
  showSponsorHighlights?: boolean;
}

export function ThinkingBlock({ thinkingContent, activeSponsor, showSponsorHighlights }: ThinkingBlockProps) {
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const [isSponsorDismissed, setIsSponsorDismissed] = useState(false);

  if (!thinkingContent) return null;

  return (
    <div className="mb-4 mt-1 border border-border/60 dark:border-[#33312E] bg-muted/20 dark:bg-[#262523]/50 rounded-xl overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsThinkingOpen(!isThinkingOpen)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground dark:text-[#A3A19C] dark:hover:text-[#E6E4DF] transition-colors"
      >
        {isThinkingOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="flex items-center gap-2">
          <Lightbulb size={12} className="text-primary/70 dark:text-[#C36A4F]/70" />
          Thinking Process
        </span>
      </button>
      
      {activeSponsor && showSponsorHighlights !== false && !isSponsorDismissed && (
        <div className="px-4 py-2 border-t border-border/30 dark:border-[#33312E]/50 bg-gradient-to-r from-primary/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-start sm:items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary dark:text-[#C36A4F] bg-primary/10 dark:bg-[#C36A4F]/20 px-1.5 py-0.5 rounded shrink-0">
              Sponsor
            </span>
            <span className="text-xs font-medium text-foreground dark:text-[#E6E4DF] shrink-0">{activeSponsor.title}</span>
            <span className="text-xs text-muted-foreground dark:text-[#8A8985] sm:ml-0.5">{activeSponsor.description && `- ${activeSponsor.description}`}</span>
          </div>
          {activeSponsor.linkUrl && (
            <a 
              href={activeSponsor.linkUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[11px] font-medium text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 shrink-0"
            >
              {activeSponsor.linkText || "Learn More"} <ExternalLink size={10} />
            </a>
          )}
          <button 
            onClick={() => setIsSponsorDismissed(true)} 
            className="text-muted-foreground hover:text-foreground dark:text-[#8A8985] dark:hover:text-[#E6E4DF] transition-colors ml-2"
            title="Dismiss ad"
            aria-label="Dismiss ad"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {isThinkingOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-border/30 dark:border-[#33312E]/50">
          <div className="prose dark:prose-invert max-w-none text-[13px] leading-relaxed text-muted-foreground dark:text-[#A3A19C] italic">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {thinkingContent}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
