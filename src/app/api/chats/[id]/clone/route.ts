import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Chat, Message } from "@/lib/db/models/Chat";
import { auth } from "@/features/auth/lib/auth";
import crypto from "crypto";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    let userId = session?.user?.id;
    
    if (!userId) {
      const guestId = req.headers.get("x-guest-id");
      if (guestId) userId = guestId;
      else {
        userId = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";
      }
    }

    if (userId === "unknown") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const originalChat = await Chat.findById(params.id);
    
    if (!originalChat || originalChat.isDeleted) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Allow cloning if the user is the owner OR if the chat is public
    const isOwner = originalChat.userId?.toString() === userId?.toString();
    if (!isOwner && !originalChat.isPublic) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const newChatId = crypto.randomUUID();
    
    // Create new chat
    const newChat = await Chat.create({
      _id: newChatId,
      userId,
      title: `${originalChat.title} (Clone)`,
      model: originalChat.model,
      mode: originalChat.mode,
      isTemporary: false,
      isPublic: false,
      status: "completed",
    });

    // Copy messages
    const messages = await Message.find({ chatId: originalChat._id }).sort({ createdAt: 1 });
    
    const newMessages = messages.map(msg => ({
      _id: crypto.randomUUID(),
      chatId: newChatId,
      role: msg.role,
      content: msg.content,
      model: msg.model,
      toolCalls: msg.toolCalls,
      toolResults: msg.toolResults,
      attachments: msg.attachments,
      tokensUsed: msg.tokensUsed,
      metadata: msg.metadata,
      createdAt: msg.createdAt, // keep original order
    }));

    if (newMessages.length > 0) {
      await Message.insertMany(newMessages);
    }

    return NextResponse.json({ success: true, newChatId });
  } catch (error: any) {
    console.error("Failed to clone chat:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
