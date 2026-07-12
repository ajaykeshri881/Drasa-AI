import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Chat, Message } from "@/lib/db/models/Chat";
import { auth } from "@/features/auth/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chats } = await req.json();
    if (!chats || Object.keys(chats).length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    await connectDB();
    let syncedCount = 0;

    for (const [chatId, payload] of Object.entries(chats) as any) {
      // Create or update chat
      const title = payload.title || "Offline Chat";
      await Chat.findOneAndUpdate(
        { _id: chatId },
        {
          $set: {
            userId: session.user.id,
            title,
            mode: payload.mode || "chat",
            model: payload.modelId || "gemini-3.1-flash-lite",
            isTemporary: false,
            status: "completed",
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      // Insert/update messages
      if (Array.isArray(payload.messages)) {
        for (const msg of payload.messages) {
          if (!msg.content && !msg.experimental_attachments) continue;
          
          let textContent = "";
          if (typeof msg.content === 'string') {
            textContent = msg.content;
          } else if (Array.isArray(msg.content)) {
            const textPart = (msg.content as any[]).find((p: any) => p.type === 'text');
            if (textPart) textContent = textPart.text;
          }

          const attachments = msg.experimental_attachments ? msg.experimental_attachments.map((a: any) => ({
            url: a.url,
            type: a.contentType?.includes('image') ? 'image' : 'file',
            name: a.name || 'attachment'
          })) : undefined;

          const msgId = msg.id || crypto.randomUUID();
          await Message.findOneAndUpdate(
            { _id: msgId },
            {
              $set: {
                chatId,
                role: msg.role,
                content: textContent,
                attachments,
                model: payload.modelId || "gemini-3.1-flash-lite",
                createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date()
              }
            },
            { upsert: true }
          );
        }
      }
      syncedCount++;
    }

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (e: any) {
    console.error("Offline chat sync error:", e);
    return NextResponse.json({ error: "Failed to sync offline chats" }, { status: 500 });
  }
}
