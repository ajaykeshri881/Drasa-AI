import { streamText, isStepCount } from "ai";

import { ModeDetector } from "./detector";
import { AIRouter } from "../gemini-config/router";
import { PromptBuilder } from "../prompts/builder";
import { AI_MODES } from "../prompts/modes";
import { GatewayRequest } from "./types";
import { GatewayPersistence } from "./persistence";
import { getGatewayTools } from "./tools";
import { getGlobalSystemConfig } from "../config";

export class AIGateway {
  public static async executeStream(req: GatewayRequest) {
    const lastUserMessage = req.messages.filter(m => m.role === "user").pop();

    // Safely extract text from content — it may be a string or an array of parts (multi-modal)
    const rawContent = lastUserMessage?.content;
    const promptText: string =
      typeof rawContent === "string"
        ? rawContent
        : Array.isArray(rawContent)
        ? (rawContent as any[]).find((p: any) => p.type === "text")?.text ?? ""
        : "";

    const mode = req.requestedMode || ModeDetector.detectMode(promptText, req.hasAttachments);

    const systemPrompt = PromptBuilder.buildSystemPrompt({
      mode,
      ...req.userContext,
      currentDate: new Date().toISOString(),
    });

    const modeConfig = AI_MODES[mode] || AI_MODES["chat"];

    return await this.executeUnifiedStream(req, systemPrompt, modeConfig.temperature, modeConfig.topP);
  }

  private static async executeUnifiedStream(
    req: GatewayRequest, 
    systemPrompt: string,
    temperature?: number,
    topP?: number
  ) {
    // Determine how many API keys we can try for Gemini
    const geminiKeys = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || "").split(",").map(k => k.trim()).filter(Boolean);
    const maxRetries = req.provider === "gemini" && geminiKeys.length > 0 ? geminiKeys.length : 1;
    
    let keyIndex = 0;
    let lastError: any = null;

    let systemConfig: any = { systemPromptBase: "" };
    if (!req.isOffline) {
      try {
        systemConfig = await getGlobalSystemConfig();
      } catch (e) {
        console.warn("Failed to get system config:", e);
      }
    }
    
    let fullSystemPrompt = systemPrompt;
    if (systemConfig?.systemPromptBase) {
      fullSystemPrompt += `\n\n[GLOBAL SYSTEM CONFIGURATION]\n${systemConfig.systemPromptBase}`;
    }
    // Mark status as generating
    await GatewayPersistence.setChatStatus(req, "generating");

    const triedModels = new Set<string>();
    triedModels.add(req.modelId);

    while (keyIndex < maxRetries) {
      const model = AIRouter.getModel(req.provider, req.modelId, keyIndex);
      let tools = getGatewayTools(req);
      
      // Ollama models do not reliably support tools and may throw errors
      if (req.provider === "ollama") {
        tools = undefined;
      }

      // Strip tool calls from history to avoid thought_signature validation issues
      const processedMessages = req.messages.map((msg: any) => {
        let content: any = typeof msg.content === 'string' ? msg.content : "";
        let role = msg.role;

        const toolsArr = msg.toolInvocations || msg.toolCalls;
        if (msg.role === 'assistant' && toolsArr && toolsArr.length > 0) {
          const toolText = toolsArr.map((ti: any) => 
            `[Generated Tool Call: ${ti.toolName || ti.name} with args: ${typeof ti.args === 'string' ? ti.args : JSON.stringify(ti.args)}]`
          ).join('\n');
          content = (msg.content || '') + '\n' + toolText;
        } else if (msg.role === 'tool' || msg.type === 'tool') {
          role = 'user';
          content = `[Tool Result: ${JSON.stringify(msg.content || msg.toolResults || [])}]`;
        } else if (Array.isArray(msg.parts)) {
          // If there are parts, only keep them if they contain multimedia (images/files).
          // Otherwise, Zod might fail if text parts are incorrectly formatted.
          const hasMultimedia = msg.parts.some((p: any) => p.type === 'image' || p.type === 'file');
          if (hasMultimedia) {
            const validParts = msg.parts.filter((p: any) => 
              p.type === 'text' || p.type === 'image' || p.type === 'file'
            ).map((p: any) => {
              if (p.type === 'text' && typeof p.text !== 'string') {
                return { type: 'text', text: msg.content || '' };
              }
              return p;
            });
            if (validParts.length > 0) {
              content = validParts;
            }
          }
        }
        
        const processedMsg: any = { role, content };
        if (msg.experimental_attachments && msg.experimental_attachments.length > 0) {
          const parts: any[] = [];
          if (typeof content === 'string' && content.trim() !== '') {
            parts.push({ type: 'text', text: content });
          } else if (Array.isArray(content)) {
            parts.push(...content);
          }
          
          for (const att of msg.experimental_attachments) {
            try {
              parts.push({ type: 'file', data: new URL(att.url), mediaType: att.contentType || 'application/octet-stream' });
            } catch (e) {
              console.warn("Invalid attachment URL:", att.url);
            }
          }
          
          if (parts.length > 0) {
            processedMsg.content = parts;
          }
        }
        
        return processedMsg;
      });

      try {
        const result = await streamText({
          model: model as any,
          system: fullSystemPrompt,
          messages: processedMessages as any,
          tools,
          stopWhen: isStepCount(5),

          temperature,
          topP,
          // Removed abortSignal to prevent cancellation when client disconnects
          onFinish: async (event) => {
            await GatewayPersistence.handleStreamFinish(req, event);
          }
        });

        const response = result.toUIMessageStreamResponse({
          onError: (err: any) => {
            console.error("=== STREAM ERROR EMITTED ===", err);
            return err?.message || String(err);
          },
        });

        // Detach stream cancellation to allow background generation to finish and save to DB
        // when the user switches tabs, refreshes, or clicks stop.
        const originalStream = response.body;
        if (!originalStream) return response;

        const reader = originalStream.getReader();
        const newStream = new ReadableStream({
          async pull(controller) {
            try {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
              } else {
                controller.enqueue(value);
              }
            } catch (e) {
              controller.error(e);
            }
          },
          cancel() {
            // Client closed the connection (tab switch, refresh, click stop).
            // Do NOT cancel the original stream. Instead, drain it in the background 
            // so the generation finishes and saves to the database.
            const drain = async () => {
              try {
                while (true) {
                  const { done } = await reader.read();
                  if (done) break;
                }
              } catch (e) {
                console.error("Background stream drain error:", e);
              }
            };
            drain();
          }
        });

        return new Response(newStream, {
          headers: response.headers,
          status: response.status,
          statusText: response.statusText
        });

      } catch (error: any) {
        lastError = error;
        const errStr = (error.message || "").toLowerCase();
        
        // Retry with next API key on rate-limit / quota errors
        if (req.provider === "gemini" && keyIndex < maxRetries - 1 && (errStr.includes("429") || errStr.includes("quota") || errStr.includes("too many requests") || errStr.includes("rate limit"))) {
          console.warn(`Gemini API key (index ${keyIndex}) rate limited. Retrying with next key...`);
          keyIndex++;
          continue;
        }
        
        if (req.isOffline) {
          break; // Do not attempt server-side fallbacks to cloud models while offline
        }
        
        // If we exhausted all keys for this model, attempt a server-side fallback to a lighter model
        const { modelId: fallbackId } = await AIRouter.getFallbackModel(req.modelId);
        
        // Only try the fallback if it's a different model that hasn't been attempted yet
        if (fallbackId !== req.modelId && !triedModels.has(fallbackId)) {
          console.warn(`Primary model ${req.modelId} exhausted. Falling back to ${fallbackId}...`);
          req.modelId = fallbackId;
          triedModels.add(fallbackId);
          keyIndex = 0; // Reset key index — try all keys for the fallback model too
          continue;
        }

        break;
      }
    }

    console.error("Primary model failed:", lastError?.message);
    await GatewayPersistence.setChatStatus(req, "failed");
    
    const errStr = (lastError?.message || "").toLowerCase();
    if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("too many requests") || errStr.includes("rate limit")) {
      throw new Error(`High demand: Model Provider Rate Limit / Quota Exceeded. (${lastError?.message})`);
    } else if (errStr.includes("500") || errStr.includes("502") || errStr.includes("503") || errStr.includes("server error")) {
      throw new Error(`High demand: Model Provider Server Issue. (${lastError?.message})`);
    }
    
    throw new Error(`High demand: Primary model failed. ${lastError?.message}`);
  }
}

export * from "./types";
