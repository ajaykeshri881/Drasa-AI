import { AI_MODES, AIMode } from "./modes";

export interface PromptContext {
  mode: AIMode;
  customInstructions?: string;
  locale?: string;
  timezone?: string;
  systemContext?: string; // From admin panel or active RAG
  currentDate: string;
}

export class PromptBuilder {
  /**
   * Composes a dynamic system prompt based on 7 layers of context:
   * 1. Core AI Identity
   * 2. Mode-specific behavior
   * 3. Temporal awareness (Date/Time)
   * 4. Geographic/Locale awareness
   * 5. User custom instructions
   * 6. System overrides (Admin alerts, global limits)
   * 7. Retrieval-Augmented Generation (RAG) context
   */
  public static buildSystemPrompt(context: PromptContext): string {
    const basePrompt = AI_MODES[context.mode]?.systemPrompt || AI_MODES["chat"].systemPrompt;
    
    let compiledPrompt = basePrompt;
    
    // Temporal & Geographic Context
    compiledPrompt += `\n\n[SYSTEM AWARENESS]\n`;
    compiledPrompt += `- Current Date: ${context.currentDate}\n`;
    if (context.timezone) compiledPrompt += `- User Timezone: ${context.timezone}\n`;
    if (context.locale) compiledPrompt += `- User Locale/Country: ${context.locale}\n`;

    // User-specific instructions
    if (context.customInstructions) {
      compiledPrompt += `\n[USER PREFERENCES]\nThe user has provided the following custom instructions that you MUST adhere to:\n"""\n${context.customInstructions}\n"""\n`;
    }

    // System/RAG context (e.g. from Pinecone or Admin Emergency Messages)
    if (context.systemContext) {
      compiledPrompt += `\n[SYSTEM CONTEXT]\nThe following context is currently active for this conversation:\n"""\n${context.systemContext}\n"""\n`;
    }

    return compiledPrompt;
  }
}
