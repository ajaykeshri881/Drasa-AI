import { create } from "zustand";
import { AIMode } from "@/lib/ai/prompts/modes";

import { persist } from "zustand/middleware";

interface SettingsState {
  defaultMode: AIMode;
  customInstructions: string;
  isCustomInstructionsEnabled: boolean;
  defaultModelId: string;
  theme: "light" | "dark" | "system";
  enterToSend: boolean;
  ollamaEnabled: boolean;
  ttsEnabled: boolean;
  setDefaultMode: (mode: AIMode) => void;
  setDefaultModelId: (modelId: string) => void;
  setCustomInstructions: (instructions: string) => void;
  setCustomInstructionsEnabled: (enabled: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setEnterToSend: (enabled: boolean) => void;
  setOllamaEnabled: (enabled: boolean) => void;
  setTtsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultMode: "chat",
      defaultModelId: "gemini-3.1-flash-lite",
      customInstructions: "",
      isCustomInstructionsEnabled: true,
      theme: "system",
      enterToSend: true,
      ollamaEnabled: false,
      ttsEnabled: false,
      setDefaultMode: (defaultMode) => set({ defaultMode }),
      setDefaultModelId: (defaultModelId) => set({ defaultModelId }),
      setCustomInstructions: (customInstructions) => set({ customInstructions }),
      setCustomInstructionsEnabled: (isCustomInstructionsEnabled) => set({ isCustomInstructionsEnabled }),
      setTheme: (theme) => set({ theme }),
      setEnterToSend: (enterToSend) => set({ enterToSend }),
      setOllamaEnabled: (ollamaEnabled) => {
        set({ ollamaEnabled });
        // Optionally sync to backend
        fetch("/api/user/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: { ollamaEnabled } }),
        }).catch(err => console.error("Failed to sync ollamaEnabled setting", err));
      },
      setTtsEnabled: (ttsEnabled) => {
        set({ ttsEnabled });
        // Sync to backend
        fetch("/api/user/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ttsEnabled }),
        }).catch(err => console.error("Failed to sync ttsEnabled setting", err));
      },
    }),
    {
      name: 'drasa-settings-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.defaultModelId?.startsWith('gemini-')) {
            useSettingsStore.setState({ defaultModelId: 'gemini-3.1-flash-lite' });
          }
        }
      },
    }
  )
);

