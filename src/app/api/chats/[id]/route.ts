import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Chat, Message } from "@/lib/db/models/Chat";
import { auth } from "@/lib/auth/auth";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    let userId = session?.user?.id;
    
    if (!userId) {
      const guestId = req.headers.get("x-guest-id");
      if (guestId) userId = guestId;
      else return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const chat = await Chat.findOne({ _id: params.id, userId });
    
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    
    const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
    
    // Map db messages to the format expected by Vercel AI SDK
    const formattedMessages = messages.map(msg => {
      let toolInvocations = undefined;
      
      if (msg.toolCalls && msg.toolResults) {
        toolInvocations = msg.toolCalls.map((tc: any, index: number) => {
          const res = msg.toolResults?.[index];
          return {
            state: 'result',
            toolCallId: tc.toolCallId || tc.id,
            toolName: tc.toolName || tc.name,
            args: tc.args,
            result: res?.result,
          };
        });
      }
      
      return {
        id: msg._id.toString(),
        role: msg.role,
        content: msg.content,
        toolInvocations
      };
    });

    return NextResponse.json({ chat, messages: formattedMessages });
  } catch (error: any) {
    console.error("Failed to fetch chat:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    let userId = session?.user?.id;
    
    if (!userId) {
      const guestId = req.headers.get("x-guest-id");
      if (guestId) userId = guestId;
      else return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const chat = await Chat.findOneAndDelete({ _id: params.id, userId });
    
    if (chat) {
      await Message.deleteMany({ chatId: chat._id });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete chat:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
