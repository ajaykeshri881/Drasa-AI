"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";

interface SplitPaneLayoutProps {
  chatPanel: React.ReactNode;
  previewPanel: React.ReactNode;
  isArtifactActive: boolean;
  onClosePreview: () => void;
}

export function SplitPaneLayout({ chatPanel, previewPanel, isArtifactActive, onClosePreview }: SplitPaneLayoutProps) {
  const [chatWidth, setChatWidth] = useState(100);

  useEffect(() => {
    // When an artifact becomes active, shrink chat to 40% width
    if (isArtifactActive) {
      setChatWidth(40);
    } else {
      setChatWidth(100);
    }
  }, [isArtifactActive]);

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
        className={`absolute top-0 right-0 h-full bg-background dark:bg-[#1A1918] transition-all duration-500 ease-in-out shadow-2xl z-20 ${
          isArtifactActive ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '60%' }}
      >
        {/* Toggle handle */}
        {isArtifactActive && (
          <button 
            onClick={onClosePreview}
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-16 bg-card dark:bg-[#1F1E1D] border border-border dark:border-[#33312E] rounded-l-xl flex items-center justify-center hover:bg-muted dark:hover:bg-[#2A2928] transition-colors z-30 shadow-md cursor-pointer"
          >
            <ChevronRight size={16} className="text-muted-foreground dark:text-[#8A8985]" />
          </button>
        )}
        
        {previewPanel}
      </div>
    </div>
  );
}
