import React from 'react';
import { Keyboard, Cpu } from 'lucide-react';
import { AI_MODES } from "@/lib/ai/prompts/modes";
import { useSettingsStore } from "@/features/settings/store/useSettingsStore";

export function AIBehaviorSection() {
  const { defaultMode, setDefaultMode, enterToSend, setEnterToSend, ttsEnabled, setTtsEnabled } = useSettingsStore();

  return (
    <>
      <section className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-medium text-foreground dark:text-[#E6E4DF] mb-4 flex items-center gap-2">
          <Cpu size={18} className="text-muted-foreground dark:text-[#8A8985]" />
          AI Behavior
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-[#E6E4DF] mb-2">Default AI Mode</label>
            <p className="text-xs text-muted-foreground dark:text-[#8A8985] mb-4">Choose the mode Drasa AI will use when starting a new chat.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(AI_MODES).map(([id, mode]) => (
                <button
                  key={id}
                  onClick={() => setDefaultMode(id as any)}
                  className={`flex flex-col items-start p-3 rounded-xl border transition-all duration-200 text-left ${
                    defaultMode === id 
                      ? 'border-primary dark:border-[#C36A4F] bg-primary/5 dark:bg-[#C36A4F]/10' 
                      : 'border-border dark:border-[#33312E] hover:bg-accent/50 dark:hover:bg-[#363532]/50'
                  }`}
                >
                  <span className={`font-medium mb-1 ${defaultMode === id ? 'text-primary dark:text-[#C36A4F]' : 'text-foreground dark:text-[#E6E4DF]'}`}>
                    {mode.name}
                  </span>
                  <span className="text-xs text-muted-foreground dark:text-[#8A8985] line-clamp-2">
                    {mode.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2 border-t border-border/50 dark:border-[#33312E]/50 pt-4">
            <div>
              <div className="font-medium text-foreground dark:text-[#E6E4DF] mb-1 flex items-center gap-2">
                Enable Local Models (Ollama)
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Experimental</span>
              </div>
              <div className="text-xs text-muted-foreground dark:text-[#8A8985]">Allow fetching and using locally hosted Ollama models. Requires Ollama to be running locally.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={useSettingsStore().ollamaEnabled} 
                onChange={(e) => useSettingsStore().setOllamaEnabled(e.target.checked)} 
              />
              <div className="w-11 h-6 bg-muted dark:bg-[#33312E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary dark:peer-checked:bg-[#C36A4F]"></div>
            </label>
          </div>
        </div>
      </section>

      <section className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-medium text-foreground dark:text-[#E6E4DF] mb-4 flex items-center gap-2">
          <Keyboard size={18} className="text-muted-foreground dark:text-[#8A8985]" />
          Input & Output Settings
        </h2>
        
        <div className="flex items-center justify-between py-2 border-b border-border/50 dark:border-[#33312E]/50">
          <div>
            <div className="font-medium text-foreground dark:text-[#E6E4DF] mb-1">Enter to Send</div>
            <div className="text-xs text-muted-foreground dark:text-[#8A8985]">Press Enter to send message, Shift+Enter for new line</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={enterToSend} onChange={(e) => setEnterToSend(e.target.checked)} />
            <div className="w-11 h-6 bg-muted dark:bg-[#33312E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary dark:peer-checked:bg-[#C36A4F]"></div>
          </label>
        </div>

        <div className="flex items-center justify-between py-4 border-b border-border/50 dark:border-[#33312E]/50">
          <div>
            <div className="font-medium text-foreground dark:text-[#E6E4DF] mb-1">Voice Output (TTS)</div>
            <div className="text-xs text-muted-foreground dark:text-[#8A8985]">Automatically read the AI's responses aloud when it finishes typing.</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={ttsEnabled} onChange={(e) => setTtsEnabled(e.target.checked)} />
            <div className="w-11 h-6 bg-muted dark:bg-[#33312E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary dark:peer-checked:bg-[#C36A4F]"></div>
          </label>
        </div>
      </section>
    </>
  );
}
