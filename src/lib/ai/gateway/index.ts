import { streamText } from "ai";
import { ModeDetector } from "./detector";
import { AIRouter } from "./router";
import { PromptBuilder } from "../prompts/builder";
import { AI_MODES } from "../prompts/modes";
import { GatewayRequest } from "./types";
import { GatewayPersistence } from "./persistence";
import { getGatewayTools } from "./tools";
import { getGlobalSystemConfig } from "../config";

export class AIGateway {
  public static async executeStream(req: GatewayRequest) {
    const lastUserMessage = req.messages.filter(m => m.role === "user").pop();
    const promptText = lastUserMessage?.content || "";
    
    const mode = req.requestedMode || ModeDetector.detectMode(promptText as string, req.hasAttachments);

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
    const model = AIRouter.getModel(req.provider, req.modelId);
    const tools = getGatewayTools(req);
    const systemConfig = await getGlobalSystemConfig();

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const fullSystemPrompt = `${systemPrompt}\n\n${systemConfig.systemPromptBase}\n\nCurrent Date: ${currentDate}.`;

    // Mark status as generating
    await GatewayPersistence.setChatStatus(req, "generating");

    try {
      const result = await streamText({
        model: model as any,
        system: fullSystemPrompt,
        messages: req.messages as any,
        tools,
        maxSteps: 5,
        temperature,
        topP,
        abortSignal: req.abortSignal,
        onFinish: async (event) => {
          await GatewayPersistence.handleStreamFinish(req, event);
        }
      });

      return result.toDataStreamResponse({
        getErrorMessage: (err: any) => {
          console.error("=== STREAM ERROR EMITTED ===", err);
          return err?.message || String(err);
        },
      });
    } catch (error: any) {
      console.error("Primary model failed:", error.message);

      const fallback = await AIRouter.getFallbackModel(req.modelId);
      
      console.log(`Attempting fallback with ${fallback.provider}:${fallback.modelId}`);
      const fallbackModel = AIRouter.getModel(fallback.provider, fallback.modelId);
      
      try {
        const fallbackResult = await streamText({
          model: fallbackModel as any,
          system: fullSystemPrompt,
          messages: req.messages as any,
          tools,
          maxSteps: 5,
          temperature,
          topP,
          abortSignal: req.abortSignal,
          onFinish: async (event) => {
            await GatewayPersistence.handleStreamFinish(req, event);
          }
        });

        return fallbackResult.toDataStreamResponse({
          getErrorMessage: (err: any) => err?.message || String(err),
        });
      } catch (fallbackError: any) {
        await GatewayPersistence.setChatStatus(req, "failed");
        
        const errStr = (fallbackError.message || "").toLowerCase();
        if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("too many requests") || errStr.includes("rate limit")) {
          throw new Error(`Model Provider Rate Limit / Quota Exceeded. (Primary: ${error.message}, Fallback: ${fallbackError.message})`);
        } else if (errStr.includes("500") || errStr.includes("502") || errStr.includes("503") || errStr.includes("server error")) {
          throw new Error(`Model Provider Server Issue. (Primary: ${error.message}, Fallback: ${fallbackError.message})`);
        }
        
        throw new Error(`We are currently experiencing high demand. Please wait a moment and try again. (Both primary and fallback models failed: ${fallbackError.message})`);
      }
    }
  }
}

export * from "./types";
