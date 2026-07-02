import React, { useRef, useEffect } from "react";
import { ChevronDown, Terminal, ImageIcon, Zap, Search } from "lucide-react";
import { AI_MODES } from "@/lib/ai/prompts/modes";

interface ModeSelectorProps {
  defaultMode: string;
  setDefaultMode: (mode: any) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  closeModelSelector: () => void;
}

export function ModeSelector({ defaultMode, setDefaultMode, isOpen, setIsOpen, closeModelSelector }: ModeSelectorProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        type="button" 
        onClick={() => {
          setIsOpen(!isOpen);
          closeModelSelector();
        }}
        className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground dark:text-[#A3A19C] dark:hover:text-[#E6E4DF] px-3 py-1.5 rounded-lg hover:bg-accent dark:hover:bg-[#363532] transition-all duration-200"
      >
        {Object.entries(AI_MODES).find(([id]) => id === defaultMode)?.[1].name || "Balanced"} 
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {Object.entries(AI_MODES).map(([id, mode]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setDefaultMode(id as any);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors ${
                defaultMode === id 
                  ? 'bg-accent dark:bg-[#363532] text-foreground dark:text-[#E6E4DF] font-medium' 
                  : 'text-muted-foreground dark:text-[#A3A19C] hover:bg-accent/50 dark:hover:bg-[#363532]/50 hover:text-foreground dark:hover:text-[#E6E4DF]'
              }`}
            >
              <span className={defaultMode === id ? 'text-primary dark:text-[#C36A4F]' : ''}>
                {id === 'code' ? <Terminal size={14} /> : 
                id === 'vision' ? <ImageIcon size={14} /> : 
                id === 'auto' ? <Search size={14} /> : <Search size={14} />}
              </span>
              {mode.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
