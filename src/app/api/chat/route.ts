import { AIGateway, GatewayRequest } from "@/lib/ai/gateway";
import { NextResponse } from "next/server";
import { auth } from "@/features/auth/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { handleAttachments } from "@/features/chat/lib/attachment-handler";
import { enforcePlanLimits } from "@/features/chat/lib/plan-enforcement";

export const maxDuration = 60; // Allow longer execution for AI APIs

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;
    const mode = body.data?.mode || body.mode;
    let provider = body.data?.provider || body.provider;
    let modelId = body.data?.modelId || body.modelId;
    const hasAttachments = body.data?.hasAttachments || body.hasAttachments;
    const attachments = body.data?.attachments || [];
    const chatId = body.data?.chatId || body.chatId;
    const isTemporaryChat = body.data?.isTemporaryChat || body.isTemporaryChat || false;

    // Handle Attachments and Model switching
    const { updatedModelId, updatedProvider } = handleAttachments(messages, attachments, modelId, provider);
    modelId = updatedModelId;
    provider = updatedProvider;

    // Optional: Get user session for personalization and usage tracking
    let session: any = null;
    try {
      session = await auth();
    } catch (authError) {
      console.warn("Auth check failed (non-blocking):", authError);
    }

    if (modelId === "meta-llama/llama-3.3-70b-instruct:free" || modelId?.includes("gemma")) {
      modelId = "openai/gpt-oss-120b:free";
    }
    if (modelId === "gemini-2.5-flash") {
      modelId = "gemini-3.5-flash";
    }
    let requestedModel = modelId || "openai/gpt-oss-120b:free";
    let userPlan = session?.user?.plan || "free";
    
    let dbUser: any = null;
    let memoriesText = "";
    if (session?.user?.email) {
      try {
        await connectDB();
        dbUser = await User.findOne({ email: session.user.email });
        if (dbUser) {
          if (dbUser.plan !== "free" && dbUser.planExpiryDate && new Date() > new Date(dbUser.planExpiryDate)) {
            await User.updateOne({ _id: dbUser._id }, { $set: { plan: "free" } });
            dbUser.plan = "free";
          }
          userPlan = dbUser.plan;
          
          if (!isTemporaryChat) {
            const lastUserMessage = messages.filter((m: any) => m.role === "user").pop();
            const queryText = lastUserMessage?.content || "";
            
            const { queryMemories } = await import('@/lib/ai/memory/vector-store');
            const semanticMemories = await queryMemories(dbUser._id.toString(), queryText, 5);
            
            const { Memory } = await import('@/lib/db/models/Memory');
            // Ensure we use the correct type for Mongoose to avoid CastError
            const recentMemories = await Memory.find({ userId: dbUser._id }).sort({ createdAt: -1 }).limit(10);
            
            const combinedMemories = new Map();
            recentMemories.forEach(m => combinedMemories.set(m.content, m));
            if (semanticMemories) {
              semanticMemories.forEach((m: any) => combinedMemories.set(m.content, m));
            }
            
            if (combinedMemories.size > 0) {
              const memoryList = Array.from(combinedMemories.values());
              memoriesText = "\n\nCRITICAL CONTEXT ABOUT THE USER (Memories):\n" + 
                memoryList.map((m: any) => `- ${m.content}`).join("\n") +
                "\n(Use these facts about the user when relevant to the conversation. If asked to remember something new, use the store_memory tool.)";
            }
          }
        }
      } catch (e) {
        console.warn("Could not verify user from DB or fetch memories:", e);
      }
    }
    
    const isGeminiRequested = requestedModel.includes("gemini");
    if (userPlan === "free" && isGeminiRequested && !hasAttachments) {
      modelId = "openai/gpt-oss-120b:free";
      requestedModel = "openai/gpt-oss-120b:free";
      provider = "openrouter";
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";

    const planEnforcementError = await enforcePlanLimits(dbUser, userPlan as string, ip, requestedModel);
    if (planEnforcementError) {
      return planEnforcementError;
    }

    // Guard: Check if required API keys are present
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (provider === "openrouter" && (!openRouterKey || openRouterKey === "your_openrouter_api_key_here")) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not configured. Please add it to your .env.local file. Get a key at https://openrouter.ai/keys" },
        { status: 500 }
      );
    }

    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (provider === "gemini" && (!geminiKey || geminiKey.includes("your_google_ai_studio_api_key_here"))) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured. Please add it to your .env.local file." },
        { status: 500 }
      );
    }

    const gatewayRequest: GatewayRequest = {
      messages,
      requestedMode: mode,
      provider: provider || "openrouter",
      modelId: modelId || requestedModel,
      hasAttachments: hasAttachments || false,
      userId: dbUser ? dbUser._id.toString() : session?.user?.id,
      ip,
      chatId: chatId || undefined,
      isTemporaryChat: isTemporaryChat || false,
      userContext: {
        customInstructions: (session?.user?.name ? `Address the user as ${session.user.name}.` : "") + memoriesText,
        locale: "en-US",
      },
      abortSignal: req.signal,
    };

    return await AIGateway.executeStream(gatewayRequest);

  } catch (error: any) {
    console.error("=== CHAT API ERROR ===");
    console.error("Error Message:", error.message);
    if (error.cause) console.error("Error Cause:", error.cause);
    
    return NextResponse.json(
      { error: "Failed to process chat request", details: error.message },
      { status: 500 }
    );
  }
}
