import { AIGateway, GatewayRequest } from "@/lib/ai/gateway";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";

export const maxDuration = 60; // Allow longer execution for AI APIs

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;
    const mode = body.data?.mode || body.mode;
    const provider = body.data?.provider || body.provider;
    const modelId = body.data?.modelId || body.modelId;
    const hasAttachments = body.data?.hasAttachments || body.hasAttachments;
    const chatId = body.data?.chatId || body.chatId;

    // Optional: Get user session for personalization and usage tracking
    let session: any = null;
    try {
      session = await auth();
    } catch (authError) {
      console.warn("Auth check failed (non-blocking):", authError);
    }

    // Enforce Plan Limits
    
    const requestedModel = modelId || "google/gemma-4-31b-it:free";
    let userPlan = session?.user?.plan || "free";
    
    let dbUser: any = null;
    let memoriesText = "";
    if (session?.user?.email) {
      try {
        await connectDB();
        dbUser = await User.findOne({ email: session.user.email });
        if (dbUser) {
          userPlan = dbUser.plan;
          // Vector DB Semantic Retrieval
          const lastUserMessage = messages.filter((m: any) => m.role === "user").pop();
          const queryText = lastUserMessage?.content || "";
          
          const { queryMemories } = await import('@/lib/ai/memory/vector-store');
          const semanticMemories = await queryMemories(dbUser._id.toString(), queryText, 10);
          
          if (semanticMemories && semanticMemories.length > 0) {
            memoriesText = "\n\nCRITICAL CONTEXT ABOUT THE USER (Relevant Memories):\n" + 
              semanticMemories.map((m: any) => `- ${m.content}`).join("\n") +
              "\n(Use these facts about the user when relevant to the conversation. If asked to remember something new, use the store_memory tool.)";
          } else {
            // Fallback to recent MongoDB memories if VectorDB is empty/unconfigured
            const { Memory } = await import('@/lib/db/models/Memory');
            const userMemories = await Memory.find({ userId: dbUser._id }).sort({ createdAt: -1 }).limit(10);
            if (userMemories.length > 0) {
              memoriesText = "\n\nCRITICAL CONTEXT ABOUT THE USER (Recent Memories):\n" + 
                userMemories.map((m: any) => `- ${m.content}`).join("\n") +
                "\n(Use these facts about the user when relevant to the conversation. If asked to remember something new, use the store_memory tool.)";
            }
          }
        }
      } catch (e) {
        console.warn("Could not verify user from DB or fetch memories:", e);
      }
    }

    // Ensure we respect the actual plan assigned in the database for accurate limit testing.
    const isGeminiRequested = requestedModel.includes("gemini");
    if (userPlan === "free" && isGeminiRequested) {
      return NextResponse.json(
        { error: `The ${requestedModel} model is restricted to paid plans. Please upgrade.` },
        { status: 403 }
      );
    }

    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    // Limit Enforcement
    if (dbUser) { // Admins/Premium get 2M monthly limit. Enforce all tiers.
      const limits = {
        free: { daily: 2000, monthly: 25000 },
        starter: { daily: 5000, monthly: 150000 },
        pro: { daily: 30000, monthly: 750000 },
        ultimate: { daily: 100000, monthly: 2000000 }
      }[userPlan as string] || { daily: 2000, monthly: 25000 };

      // Reset logic
      const now = new Date();
      const lastReset = dbUser.usage?.lastResetDate || new Date(0);
      const lastMonthlyReset = dbUser.usage?.lastMonthlyResetDate || new Date(0);
      
      const isNewDay = now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
      const isNewMonth = now.getMonth() !== lastMonthlyReset.getMonth() || now.getFullYear() !== lastMonthlyReset.getFullYear();

      const dailyTokens = isNewDay ? 0 : (dbUser.usage?.tokensUsedToday || 0);
      const monthlyTokens = isNewMonth ? 0 : (dbUser.usage?.tokensUsedThisMonth || 0);

      let needsSave = false;
      if (isNewDay) {
        if (!dbUser.usage) dbUser.usage = {};
        dbUser.usage.tokensUsedToday = 0;
        dbUser.usage.messagesUsedToday = 0;
        dbUser.usage.lastResetDate = now;
        needsSave = true;
      }
      if (isNewMonth) {
        if (!dbUser.usage) dbUser.usage = {};
        dbUser.usage.tokensUsedThisMonth = 0;
        dbUser.usage.messagesUsedThisMonth = 0;
        dbUser.usage.lastMonthlyResetDate = now;
        needsSave = true;
      }
      if (needsSave) {
        await dbUser.save();
      }

      if (dailyTokens >= limits.daily) {
        return NextResponse.json({ error: `You have reached your daily limit of ${limits.daily.toLocaleString()} tokens on the ${userPlan.toUpperCase()} plan. Please upgrade to a higher tier to continue chatting today.` }, { status: 403 });
      }
      if (monthlyTokens >= limits.monthly) {
        return NextResponse.json({ error: `You have reached your monthly limit of ${limits.monthly.toLocaleString()} tokens on the ${userPlan.toUpperCase()} plan. Please upgrade your plan to continue chatting.` }, { status: 403 });
      }

      // We will set headers on the response to indicate usage if needed, or rely on client fetching /api/user/me
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
      modelId: requestedModel,
      hasAttachments: hasAttachments || false,
      userId: session?.user?.id,
      chatId: chatId || undefined,
      userContext: {
        customInstructions: (session?.user?.name ? `Address the user as ${session.user.name}.` : "") + memoriesText,
        locale: "en-US",
      },
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
