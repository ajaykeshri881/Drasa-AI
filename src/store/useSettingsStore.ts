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
  setDefaultMode: (mode: AIMode) => void;
  setDefaultModelId: (modelId: string) => void;
  setCustomInstructions: (instructions: string) => void;
  setCustomInstructionsEnabled: (enabled: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setEnterToSend: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultMode: "chat",
      defaultModelId: "openai/gpt-oss-120b:free",
      customInstructions: "",
      isCustomInstructionsEnabled: true,
      theme: "system",
      enterToSend: true,
      setDefaultMode: (defaultMode) => set({ defaultMode }),
      setDefaultModelId: (defaultModelId) => set({ defaultModelId }),
      setCustomInstructions: (customInstructions) => set({ customInstructions }),
      setCustomInstructionsEnabled: (isCustomInstructionsEnabled) => set({ isCustomInstructionsEnabled }),
      setTheme: (theme) => set({ theme }),
      setEnterToSend: (enterToSend) => set({ enterToSend }),
    }),
    {
      name: 'drasa-settings-storage',
    }
  )
);
