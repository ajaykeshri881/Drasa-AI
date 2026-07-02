export interface PublicModelConfig {
  modelId: string;
  provider: "openrouter" | "gemini";
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
    modelId: "openai/gpt-oss-120b:free",
    provider: "openrouter",
    name: "GPT OSS 120B",
    description: "Default free model for general chat and broad text tasks.",
    isActive: true,
    isPremium: false,
    contextWindow: 8192,
    visionSupport: false,
    toolSupport: true,
  },
  {
    modelId: "gemini-3.5-flash",
    provider: "gemini",
    name: "Gemini 3.5 Flash",
    description: "Fast premium Gemini model for paid users.",
    isActive: true,
    isPremium: true,
    contextWindow: 1048576,
    visionSupport: true,
    toolSupport: true,
  },
];
