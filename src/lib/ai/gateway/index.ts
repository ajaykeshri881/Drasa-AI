import { streamText, tool } from "ai";
import { z } from "zod";
import { ModeDetector } from "./detector";
import { AIRouter, AIProvider } from "./router";
import { PromptBuilder, PromptContext } from "../prompts/builder";
import { AIMode, AI_MODES } from "../prompts/modes";

export interface GatewayMessage {
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
}

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

  private static async setChatStatus(req: GatewayRequest, status: "generating" | "completed" | "failed") {
    // Skip all DB operations for temporary chats
    if (req.isTemporaryChat) return;
    try {
      const { Chat } = await import('../../db/models/Chat');
      const { connectDB } = await import('../../db/connection');
      await connectDB();

      const chatId = req.chatId || `chat_${Date.now()}`;
      const userId = req.userId || req.ip || 'anonymous';

      const existingChat = await Chat.findById(chatId);
      if (!existingChat) {
        const title = req.messages.find(m => m.role === "user")?.content.slice(0, 40) || "New Chat";
        await Chat.create({
          _id: chatId,
          userId,
          title,
          model: req.modelId,
          mode: req.requestedMode || "chat",
          isTemporary: false,
          status,
        });
      } else {
        await Chat.findByIdAndUpdate(chatId, { status, updatedAt: new Date() });
      }
    } catch (e) {
      console.error("Failed to update chat status:", e);
    }
  }

  private static async handleStreamFinish(req: GatewayRequest, event: any) {
    // Skip all DB persistence for temporary chats
    if (!req.isTemporaryChat) {
      // 1. Save Chat and Messages to DB
      try {
        const { Chat, Message } = await import('../../db/models/Chat');
        const { connectDB } = await import('../../db/connection');
        await connectDB();

        const chatId = req.chatId || `chat_${Date.now()}`;
        const userId = req.userId || req.ip || 'anonymous';
        
        // Ensure chat exists
        const existingChat = await Chat.findById(chatId);
        if (!existingChat) {
          const title = req.messages.find(m => m.role === "user")?.content.slice(0, 40) || "New Chat";
          await Chat.create({
            _id: chatId,
            userId,
            title,
            model: req.modelId,
            mode: req.requestedMode || "chat",
            isTemporary: false,
            status: "completed"
          });
        } else {
          await Chat.findByIdAndUpdate(chatId, { status: "completed", updatedAt: new Date() });
        }

        const lastUserMsg = req.messages.filter(m => m.role === 'user').pop();
        if (lastUserMsg) {
          const userMsgId = `${chatId}_user_${Date.now()}`;
          await Message.findOneAndUpdate(
            { chatId, role: 'user', content: lastUserMsg.content },
            { 
              _id: userMsgId,
              chatId, 
              role: 'user', 
              content: lastUserMsg.content,
              model: req.modelId,
              attachments: req.hasAttachments && (lastUserMsg as any).experimental_attachments ? (lastUserMsg as any).experimental_attachments.map((a: any) => ({
                url: a.url,
                type: a.contentType?.includes('image') ? 'image' : 'file',
                name: a.name || 'attachment'
              })) : undefined
            },
            { upsert: true }
          );
        }

        // Save assistant response
        const assistantMsgId = `${chatId}_asst_${Date.now()}`;
        await Message.create({
          _id: assistantMsgId,
          chatId,
          role: 'assistant',
          content: event.text || '',
          model: req.modelId,
          toolCalls: event.toolCalls,
          toolResults: event.toolResults,
          tokensUsed: event.usage?.totalTokens || 0
        });
        
        await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });

      } catch (dbErr) {
        console.error('Failed to save chat to DB:', dbErr);
      }
    }
    if (req.userId) {
      try {
        const { User } = await import('../../db/models/User');
        const { connectDB } = await import('../../db/connection');
        await connectDB();
        await User.findByIdAndUpdate(req.userId, {
          $inc: { 
            'usage.messagesUsedToday': 1,
            'usage.tokensUsedToday': event.usage?.totalTokens || 0,
            'usage.messagesUsedThisMonth': 1,
            'usage.tokensUsedThisMonth': event.usage?.totalTokens || 0,
            'usage.filesUsedToday': req.hasAttachments ? 1 : 0
          }
        });
      } catch (e) {
        console.error('Failed to update user usage:', e);
      }

      // Skip memory extraction for temporary chats
      if (!req.isTemporaryChat) {
        try {
          const { enqueueMemoryExtraction } = await import('../../queue/producers');
          await enqueueMemoryExtraction({
            userId: req.userId,
            chatId: req.chatId || 'unknown',
            messages: [
              ...req.messages,
              { role: 'assistant' as const, content: event.text || '' }
            ],
          });
        } catch (mqErr) {
          console.warn('Failed to enqueue memory extraction (non-fatal):', mqErr);
        }
      }
    } else if (req.ip) {
      try {
        const { AnonymousUsage } = await import('../../db/models/AnonymousUsage');
        const { connectDB } = await import('../../db/connection');
        await connectDB();
        await AnonymousUsage.findOneAndUpdate(
          { ip: req.ip },
          {
            $inc: {
              'tokensUsedThisMonth': event.usage?.totalTokens || 0,
              'tokensUsedToday': event.usage?.totalTokens || 0
            }
          },
          { upsert: true }
        );
      } catch (e) {
        console.error('Failed to update anonymous usage:', e);
      }
    }
  }

  private static async executeUnifiedStream(
    req: GatewayRequest, 
    systemPrompt: string,
    temperature?: number,
    topP?: number
  ) {
    const model = AIRouter.getModel(req.provider, req.modelId);

    const tools = {
      generate_website: tool({
        description: "Generate a fully functional, single-page website using HTML, Tailwind CSS (via CDN), and Vanilla JavaScript. Use this tool when the user asks you to build a website, UI component, or web app.",
        parameters: z.object({
          html: z.string().describe("The complete, raw HTML string including the <html>, <head>, and <body> tags."),
        }),
        execute: async ({ html }) => {
          if (req.userId) {
            try {
              const { User } = await import('../../db/models/User');
              const { connectDB } = await import('../../db/connection');
              const { getPlanLimits } = await import('../../config/plans');
              await connectDB();
              
              const user = await User.findById(req.userId);
              const limits = getPlanLimits(user?.plan || "free");
              
              if ((user?.usage?.websiteGenerationsUsed || 0) >= (limits as any).monthlyWebsites) {
                return { success: false, message: `Website generation limit reached. You have used all ${(limits as any).monthlyWebsites} generations for this month on the ${limits.name} plan. Please upgrade to generate more websites.` };
              }

              await User.findByIdAndUpdate(req.userId, {
                $inc: { 'usage.websiteGenerationsUsed': 1 }
              });
            } catch (e) {
              console.error("Failed to track website generation usage:", e);
            }
          }
          return { success: true, message: "Website generated successfully and displayed in the preview pane." };
        }
      }),
      internet_search: tool({
        description: "Search the internet for up-to-date information, news, or factual queries. Use this when you need current knowledge.",
        parameters: z.object({
          query: z.string().describe("The search query."),
        }),
        execute: async ({ query }) => {
          try {
            const { search } = await import('duck-duck-scrape');
            const results = await search(query);
            if (!results.results || results.results.length === 0) {
              return { success: false, message: "No results found." };
            }
            return results.results.slice(0, 5).map((r: any) => ({
              title: r.title,
              snippet: r.description,
              url: r.url
            }));
          } catch (error: any) {
            console.error("Search failed:", error);
            try {
              const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`);
              const data = await res.json();
              if (data.query?.search) {
                return data.query.search.slice(0, 5).map((r: any) => ({
                  title: r.title,
                  snippet: r.snippet.replace(/<[^>]*>?/gm, ''),
                  url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title)}`
                }));
              }
            } catch (e) {
              return { error: "Search failed. Please try again later or provide a more specific query." };
            }
            return { error: "Search failed. Please try again later or provide a more specific query." };
          }
        }
      }),
      store_memory: tool({
        description: "Save important personal information or preferences about the user to long-term memory. Use this whenever the user explicitly tells you something about themselves, their preferences, or asks you to remember something.",
        parameters: z.object({
          content: z.string().describe("The fact or preference to remember about the user."),
          category: z.string().describe("Category of the memory (e.g., 'preference', 'fact', 'contact')").optional()
        }),
        execute: async ({ content, category }) => {
          if (!req.userId) return { success: false, message: "User not authenticated." };
          try {
             const { Memory } = await import('../../db/models/Memory');
             const { connectDB } = await import('../../db/connection');
             const { upsertMemory } = await import('../memory/vector-store');
             const mongoose = (await import('mongoose')).default;
             await connectDB();
             
             const vectorId = `local_${Date.now()}`;
             const isObjectId = mongoose.Types.ObjectId.isValid(req.userId);
             const dbUserId = isObjectId ? new mongoose.Types.ObjectId(req.userId) : req.userId;
             
             await Memory.create({
               userId: dbUserId,
               content,
               category: category || 'fact',
               pineconeId: vectorId
             });
             // Fire and forget Redis vector upsert, but handle errors cleanly
             try {
               await upsertMemory(req.userId, vectorId, content, category || 'fact');
             } catch (e) {
               console.error("ALERT: Failed to upsert to Redis vector store. Memory only saved to MongoDB:", e);
               // We still return success because MongoDB save succeeded, but logged the vector DB failure
             }
             
             return { success: true, message: "Memory saved successfully." };
          } catch (e) {
             console.error("Failed to save memory tool (MongoDB error):", e);
             return { success: false, message: "Failed to save memory." };
          }
        }
      })
    };

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const fullSystemPrompt = `${systemPrompt}\n\nCurrent Date: ${currentDate}.`;

    // Mark status as generating
    await this.setChatStatus(req, "generating");

    try {
      const result = await streamText({
        model: model as any,
        system: fullSystemPrompt,
        messages: req.messages as any,
        tools,
        maxSteps: 5,
        temperature,
        topP,
        onFinish: async (event) => {
          await this.handleStreamFinish(req, event);
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
      
      // If the user hit a hard limit, don't attempt fallback
      if (error.message?.includes("Rate limit") || error.message?.includes("credits")) {
        await this.setChatStatus(req, "failed");
        throw new Error(error.message);
      }

      const fallback = AIRouter.getFallbackModel(req.modelId);
      
      console.log(`Attempting fallback with ${fallback.provider}:${fallback.modelId}`);
      const fallbackModel = AIRouter.getModel(fallback.provider, fallback.modelId);
      
      try {
        const fallbackResult = await streamText({
          model: fallbackModel as any,
          system: systemPrompt,
          messages: req.messages as any,
          tools,
          maxSteps: 5,
          temperature,
          topP,
          onFinish: async (event) => {
            await this.handleStreamFinish(req, event);
          }
        });

        return fallbackResult.toDataStreamResponse({
          getErrorMessage: (err: any) => err?.message || String(err),
        });
      } catch (fallbackError: any) {
        await this.setChatStatus(req, "failed");
        throw new Error(`Both primary and fallback models failed. Last error: ${fallbackError.message}`);
      }
    }
  }
}
