import { NextResponse } from "next/server";
import { generateText } from "ai";
import { AIRouter } from "@/lib/ai/gemini-config/router";
import { connectDB } from "@/lib/db/connection";
import { Chat } from "@/lib/db/models/Chat";
import { auth } from "@/features/auth/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, chatId } = body;

    if (!messages || messages.length === 0 || !chatId) {
      return NextResponse.json({ error: "Missing messages or chatId" }, { status: 400 });
    }

    // Get a standard model for title generation
    const provider = "gemini";
    const modelId = "gemini-3.1-flash-lite";
    
    const model = AIRouter.getModel(provider, modelId);

    const sanitizedMessages = messages.slice(0, 2).map((m: any) => ({
      role: (m.role === 'user' || m.role === 'assistant' || m.role === 'system') ? m.role : 'user',
      content: typeof m.content === 'string' ? m.content : (m.parts?.find((p: any) => p.type === 'text')?.text || "")
    }));

    const { text } = await generateText({
      model: model as any,
      system: "You are a helpful assistant. Generate a short, concise title (max 5 words) for the following conversation. Do not use quotes or punctuation in the title. Return ONLY the title string.",
      messages: sanitizedMessages,
    });

    const title = text.trim();

    // Optionally update the chat in the database if the user is authenticated
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
      await Chat.updateOne({ _id: chatId, userId }, { $set: { title } });
    } catch (dbErr) {
      console.warn("Failed to update chat title in DB:", dbErr);
    }

    return NextResponse.json({ title });
  } catch (error: any) {
    console.error("Title generation error:", error);
    return NextResponse.json({ error: "Failed to generate title" }, { status: 500 });
  }
}

