export interface PublicModelConfig {
  modelId: string;
  provider: "gemini";
  name: string;
  description: string;
  isActive: boolean;
  isPremium: boolean;
  contextWindow: number;
  visionSupport: boolean;
  toolSupport: boolean;
}

export const DEFAULT_MODEL_CONFIGS: PublicModelConfig[] = [
  {
    modelId: "gemini-3.1-flash-lite",
    provider: "gemini",
    name: "Standard",
    description: "Standard model for general chat and broad text tasks.",
    isActive: true,
    isPremium: false,
    contextWindow: 1048576,
    visionSupport: true,
    toolSupport: true,
  },
  {
    modelId: "gemini-3.5-flash",
    provider: "gemini",
    name: "Advance",
    description: "Advanced premium Gemini model for complex tasks.",
    isActive: true,
    isPremium: true,
    contextWindow: 1048576,
    visionSupport: true,
    toolSupport: true,
  },
];

