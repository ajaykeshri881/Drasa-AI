"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface SplitPaneLayoutProps {
  chatPanel: React.ReactNode;
  previewPanel: React.ReactNode;
  isArtifactActive: boolean;
  onClosePreview: () => void;
}

export function SplitPaneLayout({ chatPanel, previewPanel, isArtifactActive, onClosePreview }: SplitPaneLayoutProps) {
  const [chatWidth, setChatWidth] = useState(100);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    // When an artifact becomes active, shrink chat to 40% width on desktop
    if (isArtifactActive) {
      setChatWidth(isDesktop ? 40 : 100);
    } else {
      setChatWidth(100);
    }
  }, [isArtifactActive, isDesktop]);

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Chat Panel (Left) */}
      <div 
        className="h-full flex-shrink-0 transition-all duration-500 ease-in-out z-10 bg-background dark:bg-[#1A1918]"
        style={{ width: `${chatWidth}%` }}
      >
        {chatPanel}
      </div>

      {/* Artifact/Preview Panel (Right) */}
      <div 
        className={`absolute top-0 right-0 h-full bg-background dark:bg-[#1A1918] transition-transform duration-500 ease-in-out shadow-2xl z-50 md:z-20 ${
          isArtifactActive ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: isDesktop ? '60%' : '100%' }}
      >
        {/* Toggle handle / Close button */}
        {isArtifactActive && (
          <button 
            onClick={onClosePreview}
            className={`absolute z-50 flex items-center justify-center transition-colors shadow-md cursor-pointer ${
              isDesktop 
                ? "-left-4 top-1/2 -translate-y-1/2 w-8 h-16 bg-card dark:bg-[#1F1E1D] border border-border dark:border-[#33312E] rounded-l-xl hover:bg-muted dark:hover:bg-[#2A2928]" 
                : "top-4 right-4 w-10 h-10 bg-card/80 dark:bg-[#1F1E1D]/80 backdrop-blur-sm border border-border dark:border-[#33312E] rounded-full hover:bg-muted dark:hover:bg-[#2A2928]"
            }`}
          >
            {isDesktop ? (
              <ChevronRight size={16} className="text-muted-foreground dark:text-[#8A8985]" />
            ) : (
              <X size={20} className="text-muted-foreground dark:text-[#8A8985]" />
            )}
          </button>
        )}
        
        {previewPanel}
      </div>
    </div>
  );
}
