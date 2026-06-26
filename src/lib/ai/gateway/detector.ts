import { AIMode } from "../prompts/modes";

export class ModeDetector {
  /**
   * Heuristically determines the best AI Mode for a given prompt if the user hasn't explicitly set one.
   * Uses regex boundaries to prevent false positives (e.g. "don't write a script").
   */
  public static detectMode(prompt: string, hasAttachments: boolean): AIMode {
    if (hasAttachments) {
      return "chat";
    }

    const lowerPrompt = prompt.toLowerCase();

    // Check for negative intent that might falsely trigger a mode
    const hasNegativeIntent = /\b(don'?t|do not|stop|never|avoid)\b/i.test(lowerPrompt);

    // Code heuristics
    const codeRegex = /\b(write|create|debug|refactor|fix|build|explain)\b.*\b(script|code|function|component|app|api|program)\b/i;
    const directCodeRegex = /\b(python|javascript|typescript|react|nextjs|html|css|java|c\+\+|golang|rust|bash)\b/i;
    
    if (!hasNegativeIntent && (codeRegex.test(lowerPrompt) || directCodeRegex.test(lowerPrompt))) {
      return "code";
    }

    // Web heuristics — require more specific real-time query phrases
    const webRegex = /\b(search (the )?web|latest news|current (price|status|weather)|today'?s|breaking news|live score)\b/i;
    const questionRegex = /^(who|what|where|when|why|how)\b.*\b(now|today|currently|latest|won|happened)\b/i;
    
    if (!hasNegativeIntent && (webRegex.test(lowerPrompt) || questionRegex.test(lowerPrompt))) {
      return "web";
    }

    // Reasoning heuristics
    const reasoningRegex = /\b(solve this puzzle|think step(\s?by\s?)step|logically deduce|analyze this mathematically|prove that)\b/i;
    
    if (!hasNegativeIntent && reasoningRegex.test(lowerPrompt)) {
      return "reasoning";
    }

    // Default to general chat
    return "chat";
  }
}
