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
    description: "Default free OpenRouter model for general chat.",
    isActive: true,
    isPremium: false,
    contextWindow: 8192,
    visionSupport: false,
    toolSupport: true,
  },
  {
    modelId: "google/gemma-4-31b-it:free",
    provider: "openrouter",
    name: "Gemma Free",
    description: "Fallback free OpenRouter model for broad text tasks.",
    isActive: true,
    isPremium: false,
    contextWindow: 8192,
    visionSupport: false,
    toolSupport: true,
  },
  {
    modelId: "gemini-2.5-flash",
    provider: "gemini",
    name: "Gemini 2.5 Flash",
    description: "Fast premium Gemini model for paid users.",
    isActive: true,
    isPremium: true,
    contextWindow: 1048576,
    visionSupport: true,
    toolSupport: true,
  },
];
