import { getGeminiModel } from "../providers/gemini";
import { getGlobalSystemConfig } from "../config";
import { ollama } from "ai-sdk-ollama";

export type AIProvider = "gemini" | "ollama";

export class AIRouter {
  /**
   * Resolves the appropriate Vercel AI SDK LanguageModel object.
   */
  public static getModel(provider: AIProvider, modelId: string, keyIndex: number = 0) {
    if (provider === "ollama") {
      const actualModelId = modelId.replace("ollama/", "");
      return ollama(actualModelId);
    }
    if (provider !== "gemini") {
      throw new Error(`Unsupported AI Provider: ${provider}. Only gemini and ollama are supported.`);
    }
    return getGeminiModel(modelId, keyIndex);
  }

  /**
   * Smart fallback routing using DB-driven global config.
   */
  public static async getFallbackModel(primaryModelId: string): Promise<{ provider: AIProvider; modelId: string }> {
    // Basic fallback logic cycling through the Gemini tiers
    if (primaryModelId === 'gemini-3.5-flash') {
      return { provider: "gemini", modelId: "gemini-3.1-flash-lite" };
    } else if (primaryModelId === 'gemini-3.1-flash-lite') {
      return { provider: "gemini", modelId: "gemini-3.5-flash" };
    } else {
      return { provider: "gemini", modelId: "gemini-3.1-flash-lite" };
    }
  }
}

