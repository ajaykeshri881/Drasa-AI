import { getGeminiModel } from "../providers/gemini";
import { createOpenAI } from '@ai-sdk/openai';

export type AIProvider = "openrouter" | "gemini";

export class AIRouter {
  /**
   * Resolves the appropriate Vercel AI SDK LanguageModel object.
   */
  public static getModel(provider: AIProvider, modelId: string) {
    switch (provider) {
      case "gemini":
        return getGeminiModel(modelId);
      case "openrouter":
        const openrouter = createOpenAI({
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: process.env.OPENROUTER_API_KEY
        });
        return openrouter(modelId);
      default:
        throw new Error(`Unsupported AI Provider: ${provider}`);
    }
  }

  /**
   * Smart fallback routing: 
   * All fallbacks use free OpenRouter models to avoid credit/key issues.
   */
  public static getFallbackModel(primaryModelId: string): { provider: AIProvider; modelId: string } {
    if (primaryModelId.includes("claude") || primaryModelId.includes("gpt-4o")) {
      return { provider: "openrouter", modelId: "google/gemma-4-26b-a4b-it:free" };
    }

    return { provider: "openrouter", modelId: "google/gemma-4-31b-it:free" };
  }
}
