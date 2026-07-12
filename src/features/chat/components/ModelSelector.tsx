import React, { useRef, useEffect, useState } from "react";
import { ChevronDown, Cpu, HelpCircle, Download } from "lucide-react";

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="max-h-[300px] overflow-y-auto p-1 scrollbar-thin">
            {visibleModels.filter(m => m.provider !== 'ollama').map((model) => (
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

            {visibleModels.some(m => m.provider === 'ollama') && (
              <>
                <div className="h-px bg-border dark:bg-[#33312E] my-1 mx-2" />
                <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Ollama
                </div>
                {isMobile ? (
                  <div className="px-3 py-2 text-[12px] text-muted-foreground dark:text-[#A3A19C] text-center italic">
                    Ollama is not available on phones, use it on a laptop.
                  </div>
                ) : (
                  visibleModels.filter(m => m.provider === 'ollama').map((model) => (
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
                  ))
                )}
              </>
            )}

            {!isMobile && (
              <>
                <div className="h-px bg-border dark:bg-[#33312E] my-1 mx-2" />
                <a
                  href="/ollama"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-muted-foreground hover:text-primary dark:text-[#A3A19C] dark:hover:text-[#C36A4F] hover:bg-accent dark:hover:bg-[#32302D] rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Setup Local Models...</span>
                  </div>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary dark:bg-[#C36A4F]/20 dark:text-[#C36A4F]">Guide</span>
                </a>
                <a
                  href="https://ollama.com/library"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground dark:text-[#A3A19C] dark:hover:text-[#E6E4DF] hover:bg-accent dark:hover:bg-[#32302D] rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download more models...</span>
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
