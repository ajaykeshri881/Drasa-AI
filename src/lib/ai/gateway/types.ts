import { AIProvider } from "./router";
import { PromptContext } from "../prompts/builder";
import { AIMode } from "../prompts/modes";

export interface GatewayMessage {
  id?: string;
  role: "user" | "assistant" | "system" | "data" | "tool";
  content: string;
}

export interface GatewayRequest {
  messages: GatewayMessage[];
  provider: AIProvider;
  modelId: string;
  hasAttachments: boolean;
  userContext: Omit<PromptContext, "mode" | "currentDate">;
  requestedMode?: AIMode;
  userId?: string;
  ip?: string;
  chatId?: string;
  isTemporaryChat?: boolean;
  abortSignal?: AbortSignal;
}
