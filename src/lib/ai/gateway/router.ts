import { getGeminiModel } from "../providers/gemini";
import { createOpenAI } from '@ai-sdk/openai';
import { getGlobalSystemConfig } from "../config";

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
   * Smart fallback routing using DB-driven global config.
   */
  public static async getFallbackModel(primaryModelId: string): Promise<{ provider: AIProvider; modelId: string }> {
    const systemConfig = await getGlobalSystemConfig();
    
    // Check if the primary model is likely a vision/multimodal request
    if (primaryModelId.includes("claude") || primaryModelId.includes("gpt-4o") || primaryModelId.includes("vision")) {
      return { provider: "openrouter", modelId: systemConfig.defaultVisionModelId };
    }
    
    // Bi-directional fallback logic as requested by user
    if (primaryModelId.includes("gemini")) {
      return { provider: "openrouter", modelId: "openai/gpt-oss-120b:free" };
    } else {
      return { provider: "gemini", modelId: "gemini-3.5-flash" };
    }
  }
}
