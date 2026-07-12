import { AI_MODES, AIMode } from "./modes";

export interface PromptContext {
  mode: AIMode;
  customInstructions?: string;
  userName?: string;
  userMemories?: string;
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
   * 5. User Profile & Memories
   * 6. User custom instructions
   * 7. System overrides (Admin alerts, global limits)
   * 8. Retrieval-Augmented Generation (RAG) context
   */
  public static buildSystemPrompt(context: PromptContext): string {
    const basePrompt = AI_MODES[context.mode]?.systemPrompt || AI_MODES["chat"].systemPrompt;
    
    let compiledPrompt = basePrompt;
    
    // Temporal & Geographic Context
    compiledPrompt += `\n\n[SYSTEM AWARENESS]\n`;
    compiledPrompt += `- Current Date: ${context.currentDate}\n`;
    if (context.timezone) compiledPrompt += `- User Timezone: ${context.timezone}\n`;
    if (context.locale) compiledPrompt += `- User Locale/Country: ${context.locale}\n`;

    // User Profile
    compiledPrompt += `\n[USER PROFILE]\n`;
    compiledPrompt += `You are talking to a human user.\n`;
    if (context.userName) compiledPrompt += `- Name: ${context.userName}\n`;
    
    if (context.userMemories) {
      compiledPrompt += `\n[USER MEMORIES]\n`;
      compiledPrompt += `The following are facts and memories the user has shared in the past. Note that first-person pronouns (like 'I' or 'my') in these memories refer to the USER, not you:\n`;
      compiledPrompt += `${context.userMemories}\n`;
      compiledPrompt += `(Use these facts to personalize your responses. DO NOT adopt these facts as your own identity. If asked to remember something new, use the store_memory tool.)\n`;
    }

    // User-specific instructions
    if (context.customInstructions) {
      compiledPrompt += `\n[CUSTOM INSTRUCTIONS]\nThe user has provided the following custom instructions that you MUST adhere to:\n"""\n${context.customInstructions}\n"""\n`;
    }

    // System/RAG context (e.g. from Pinecone or Admin Emergency Messages)
    if (context.systemContext) {
      compiledPrompt += `\n[SYSTEM CONTEXT]\nThe following context is currently active for this conversation:\n"""\n${context.systemContext}\n"""\n`;
    }

    return compiledPrompt;
  }
}
