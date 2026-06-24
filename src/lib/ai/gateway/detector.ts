import { AIMode } from "../prompts/modes";

export class ModeDetector {
  /**
   * Heuristically determines the best AI Mode for a given prompt if the user hasn't explicitly set one.
   * This allows "Auto" mode to seamlessly switch between Vision, Code, Reasoning, Web, and Chat.
   */
  public static detectMode(prompt: string, hasAttachments: boolean): AIMode {
    if (hasAttachments) {
      return "chat";
    }

    const lowerPrompt = prompt.toLowerCase();


    // Code heuristics
    if (
      lowerPrompt.includes("write a script") ||
      lowerPrompt.includes("debug this") ||
      lowerPrompt.includes("function in") ||
      lowerPrompt.includes("component in react") ||
      lowerPrompt.includes("how to code") ||
      lowerPrompt.includes("refactor this")
    ) {
      return "code";
    }

    // Web heuristics — require more specific real-time query phrases
    if (
      lowerPrompt.includes("search the web") ||
      lowerPrompt.includes("search for") ||
      lowerPrompt.includes("latest news") ||
      lowerPrompt.includes("who won the") ||
      lowerPrompt.includes("current price of") ||
      lowerPrompt.includes("what is the current") ||
      lowerPrompt.includes("who is the current") ||
      lowerPrompt.includes("today's") ||
      lowerPrompt.includes("breaking news") ||
      lowerPrompt.includes("live score")
    ) {
      return "web";
    }

    // Reasoning heuristics
    if (
      lowerPrompt.includes("solve this puzzle") ||
      lowerPrompt.includes("think step by step") ||
      lowerPrompt.includes("logically deduce")
    ) {
      return "reasoning";
    }


    // Default to general chat
    return "chat";
  }
}
