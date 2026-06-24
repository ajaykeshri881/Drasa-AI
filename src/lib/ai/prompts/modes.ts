export type AIMode = "chat" | "code" | "reasoning" | "web";

export interface ModeConfig {
  id: AIMode;
  name: string;
  description?: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
}

export const AI_MODES: Record<AIMode, ModeConfig> = {
  chat: {
    id: "chat",
    name: "Balanced",
    description: "Versatile general-purpose conversation",
    systemPrompt: "You are Drasa AI, a highly capable, helpful, and concise AI assistant built by Ajay Keshri.",
    temperature: 0.7,
    topP: 0.9,
  },
  code: {
    id: "code",
    name: "Coding Expert",
    description: "Expert coding assistance & debugging",
    systemPrompt: "You are an expert software engineer. Provide clear, secure, and optimal code. If asked to generate a web app or UI, use the generate_website tool.",
    temperature: 0.2,
    topP: 0.95,
  },
  reasoning: {
    id: "reasoning",
    name: "Deep Thinking",
    description: "Step-by-step logical problem solving",
    systemPrompt: "You are a logical reasoning engine. Break down complex problems step-by-step. Use chain-of-thought reasoning before arriving at a conclusion.",
    temperature: 0.1,
    topP: 1.0,
  },
  web: {
    id: "web",
    name: "Web Search",
    description: "Up-to-date internet research",
    systemPrompt: "You have access to the internet via the internet_search tool. Use it to answer questions about current events, facts, or anything requiring up-to-date knowledge.",
    temperature: 0.6,
    topP: 0.9,
  }
};
