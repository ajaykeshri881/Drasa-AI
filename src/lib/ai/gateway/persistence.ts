import { GatewayRequest } from "./types";

export class GatewayPersistence {
  public static async setChatStatus(req: GatewayRequest, status: "generating" | "completed" | "failed") {
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

  public static async handleStreamFinish(req: GatewayRequest, event: any) {
    if (!req.isTemporaryChat) {
      try {
        const { Chat, Message } = await import('../../db/models/Chat');
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
            status: "completed"
          });
        } else {
          await Chat.findByIdAndUpdate(chatId, { status: "completed", updatedAt: new Date() });
        }

        const lastUserMsg = req.messages.filter(m => m.role === 'user').pop();
        if (lastUserMsg) {
          const userMsgId = lastUserMsg.id || `${chatId}_user_${Date.now()}`;
          await Message.findOneAndUpdate(
            { _id: userMsgId },
            { 
              $set: {
                chatId, 
                role: 'user', 
                content: lastUserMsg.content,
                model: req.modelId,
                attachments: req.hasAttachments && (lastUserMsg as any).experimental_attachments ? (lastUserMsg as any).experimental_attachments.map((a: any) => ({
                  url: a.url,
                  type: a.contentType?.includes('image') ? 'image' : 'file',
                  name: a.name || 'attachment'
                })) : undefined
              }
            },
            { upsert: true }
          );
        }

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
}
