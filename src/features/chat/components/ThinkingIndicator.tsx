import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ThinkingIndicatorProps {
  loadingText: string;
  showSponsorHighlights: boolean;
  activeSponsor: any;
  isThinkingLong: boolean;
}

const PHRASES = {
  "Thinking": [
    "Thinking",
    "Gathering thoughts",
    "Analyzing context",
    "Connecting the dots",
    "Synthesizing response",
    "Crafting a reply",
    "Almost there"
  ],
  "Searching the web": [
    "Searching the web",
    "Reading search results",
    "Analyzing web pages",
    "Extracting key information",
    "Compiling findings"
  ],
  "Generating website": [
    "Generating website",
    "Designing layout",
    "Writing components",
    "Applying styles",
    "Finalizing code"
  ]
};

export function ThinkingIndicator({ loadingText, showSponsorHighlights, activeSponsor, isThinkingLong }: ThinkingIndicatorProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isSponsorDismissed, setIsSponsorDismissed] = useState(false);

  useEffect(() => {
    setPhraseIndex(0);
  }, [loadingText]);

  useEffect(() => {
    const currentPhrases = PHRASES[loadingText as keyof typeof PHRASES];
    if (!currentPhrases || currentPhrases.length <= 1) return;

    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % currentPhrases.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [loadingText]);

  const currentPhrases = PHRASES[loadingText as keyof typeof PHRASES];
  const displayString = currentPhrases ? currentPhrases[phraseIndex] : loadingText;

  return (
    <div className="flex flex-col sm:flex-row w-full px-4 md:px-0 py-4 sm:py-6 gap-4 sm:gap-6 bg-transparent items-start sm:items-center">
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-3 py-1">
          <span 
            key={displayString} 
            className="text-[13px] font-medium text-muted-foreground dark:text-[#8A8985] italic tracking-wide animate-in fade-in slide-in-from-bottom-2 duration-300 whitespace-nowrap"
          >
            {displayString}
          </span>
          <span className="flex space-x-1 shrink-0">
            <span className="w-1.5 h-1.5 bg-muted-foreground dark:bg-[#8A8985] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-muted-foreground dark:bg-[#8A8985] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-muted-foreground dark:bg-[#8A8985] rounded-full animate-bounce"></span>
          </span>
        </div>
      </div>
      
      {showSponsorHighlights && activeSponsor && isThinkingLong && !isSponsorDismissed && (
        <div className="sm:ml-auto relative group w-full sm:w-auto max-w-full md:max-w-[80%] animate-in fade-in zoom-in duration-500 mt-2 sm:mt-0">
          {/* Animated Glow Effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/40 via-primary/10 to-primary/40 dark:from-[#C36A4F]/40 dark:via-[#C36A4F]/10 dark:to-[#C36A4F]/40 rounded-2xl blur-sm opacity-50 group-hover:opacity-100 transition duration-700"></div>
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center bg-background/95 dark:bg-[#1E1D1B]/95 backdrop-blur-xl border border-primary/20 dark:border-[#C36A4F]/30 rounded-2xl p-3 sm:px-4 sm:py-2.5 gap-3 shadow-xl">
            
            {/* Badge Area */}
            <div className="flex items-center gap-1.5 shrink-0 bg-primary/10 dark:bg-[#C36A4F]/15 px-2 py-1 rounded-md border border-primary/20 dark:border-[#C36A4F]/30 shadow-inner">
              
              <span className="text-[9px] uppercase font-bold text-primary dark:text-[#C36A4F] tracking-widest">
                Partner
              </span>
            </div>
            
            <div className="hidden sm:block h-7 w-px bg-border/60 dark:bg-[#33312E] shrink-0"></div>
            
            {/* Content Area */}
            <div className="flex-1 min-w-0 w-full pr-6 sm:pr-0">
              {activeSponsor.linkUrl ? (
                <a href={activeSponsor.linkUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col group/link leading-snug w-full">
                  <span className="text-[13px] font-bold text-foreground/90 dark:text-[#E6E4DF] group-hover/link:text-primary dark:group-hover/link:text-[#C36A4F] transition-colors mb-0.5">
                    {activeSponsor.title}
                  </span> 
                  {activeSponsor.description && (
                    <span className="text-[11.5px] text-muted-foreground/80 dark:text-[#8A8985] leading-relaxed break-words line-clamp-2">
                      {activeSponsor.description}
                    </span>
                  )}
                </a>
              ) : (
                <div className="flex flex-col leading-snug w-full">
                  <span className="text-[13px] font-bold text-foreground/90 dark:text-[#E6E4DF] mb-0.5">
                    {activeSponsor.title}
                  </span> 
                  {activeSponsor.description && (
                    <span className="text-[11.5px] text-muted-foreground/80 dark:text-[#8A8985] leading-relaxed break-words line-clamp-2">
                      {activeSponsor.description}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Arrow for link */}
            {activeSponsor.linkUrl && (
              <div className="absolute right-3 top-3.5 sm:relative sm:right-auto sm:top-auto sm:ml-1 text-primary/40 group-hover:text-primary dark:text-[#C36A4F]/40 dark:group-hover:text-[#C36A4F] transition-colors shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              </div>
            )}
            
            <button 
              onClick={() => setIsSponsorDismissed(true)} 
              className="absolute top-2 right-2 text-muted-foreground/60 hover:text-foreground dark:text-[#8A8985]/60 dark:hover:text-[#E6E4DF] transition-colors p-1 rounded-full hover:bg-muted/50 dark:hover:bg-[#33312E]/50 z-10"
              title="Dismiss ad"
              aria-label="Dismiss ad"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
