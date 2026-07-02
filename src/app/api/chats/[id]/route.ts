import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Chat, Message } from "@/lib/db/models/Chat";
import { auth } from "@/features/auth/lib/auth";
import { User } from "@/lib/db/models/User";
import mongoose from "mongoose";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
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

    await connectDB();
    const chat = await Chat.findById(params.id);
    
    if (!chat || chat.isDeleted) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Allow access if the user is the owner OR if the chat is public
    const isOwner = chat.userId?.toString() === userId?.toString();
    if (!isOwner && !chat.isPublic) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    
    const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 }).limit(100);
    
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

    let ownerName = "User";
    if (mongoose.Types.ObjectId.isValid(chat.userId)) {
      const user = await User.findById(chat.userId).select('name');
      if (user) ownerName = user.name;
    } else if (typeof chat.userId === 'string' && chat.userId.startsWith('guest_')) {
      ownerName = "Guest";
    }

    return NextResponse.json({ chat, messages: formattedMessages, isOwner, ownerName });
  } catch (error: any) {
    console.error("Failed to fetch chat:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
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

    const body = await req.json();
    const { isPublic } = body;

    if (typeof isPublic !== "boolean") {
      return NextResponse.json({ error: "isPublic must be a boolean" }, { status: 400 });
    }

    await connectDB();
    const chat = await Chat.findOneAndUpdate(
      { _id: params.id, userId },
      { 
        $set: { 
          isPublic,
          ...(isPublic ? { sharedAt: new Date() } : {}),
        }
      },
      { new: true }
    );

    if (!chat) {
      return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, isPublic: chat.isPublic });
  } catch (error: any) {
    console.error("Failed to update chat sharing:", error);
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
      else {
        userId = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";
      }
    }

    await connectDB();
    const chat = await Chat.findOneAndUpdate({ _id: params.id, userId }, { $set: { isDeleted: true } });
    
    // We do not delete messages anymore as we use soft deletes to preserve analytical integrity.
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete chat:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
