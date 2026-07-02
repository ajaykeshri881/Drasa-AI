import React, { useRef, useEffect } from "react";
import { ChevronDown, Cpu } from "lucide-react";

interface ModelConfig {
  modelId: string;
  name: string;
  provider: string;
  isPremium: boolean;
  visionSupport?: boolean;
}

interface ModelSelectorProps {
  visibleModels: ModelConfig[];
  defaultModelId: string;
  setDefaultModelId: (modelId: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  closeModeSelector: () => void;
  getModelLabel: (id: string) => string;
}

export function ModelSelector({
  visibleModels,
  defaultModelId,
  setDefaultModelId,
  isOpen,
  setIsOpen,
  closeModeSelector,
  getModelLabel
}: ModelSelectorProps) {
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
          closeModeSelector();
        }}
        className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground dark:text-[#A3A19C] dark:hover:text-[#E6E4DF] px-3 py-1.5 rounded-lg hover:bg-accent dark:hover:bg-[#363532] transition-all duration-200"
      >
        <Cpu size={14} className={defaultModelId.includes('gemini') ? 'text-primary' : ''} />
        {getModelLabel(defaultModelId)} 
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {visibleModels.map((model) => (
            <button
              key={model.modelId}
              type="button"
              onClick={() => {
                setDefaultModelId(model.modelId);
                setIsOpen(false);
              }}
              className={`w-full flex flex-col items-start px-3 py-2.5 rounded-lg transition-colors ${
                defaultModelId === model.modelId 
                  ? "bg-primary/5 dark:bg-[#C36A4F]/10 border border-primary/20 dark:border-[#C36A4F]/20" 
                  : "hover:bg-accent dark:hover:bg-[#32302D] border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-0.5">
                <span className={`text-[13px] font-semibold ${defaultModelId === model.modelId ? "text-primary dark:text-[#C36A4F]" : "text-foreground dark:text-[#E6E4DF]"}`}>
                  {getModelLabel(model.modelId)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
