import { AIGateway, GatewayRequest } from "@/lib/ai/gateway";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { AnonymousUsage } from "@/lib/db/models/AnonymousUsage";
import { getPlanLimits } from "@/lib/config/plans";

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

    if (attachments.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        lastMessage.experimental_attachments = attachments.map((att: any) => ({
          url: att.url,
          contentType: att.mimeType,
          name: att.name
        }));
      }
      
      // Auto-switch model if attachments exist and current model likely doesn't support vision
      if (!modelId?.includes('vision') && !modelId?.includes('gemini') && !modelId?.includes('gpt-4') && !modelId?.includes('claude-3') && !modelId?.includes('pixtral')) {
        modelId = "meta-llama/llama-3.2-11b-vision-instruct:free";
        provider = "openrouter";
      }
    }

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
          // Check if subscription has expired
          if (dbUser.plan !== "free" && dbUser.planExpiryDate) {
            if (new Date() > new Date(dbUser.planExpiryDate)) {
              // Downgrade to free
              await User.updateOne({ _id: dbUser._id }, { $set: { plan: "free" } });
              dbUser.plan = "free";
            }
          }
          userPlan = dbUser.plan;
          
          // Skip memory retrieval for temporary chats
          if (!isTemporaryChat) {
            // Vector DB Semantic Retrieval
            const lastUserMessage = messages.filter((m: any) => m.role === "user").pop();
            const queryText = lastUserMessage?.content || "";
            
            const { queryMemories } = await import('@/lib/ai/memory/vector-store');
            const semanticMemories = await queryMemories(dbUser._id.toString(), queryText, 5);
            
            const { Memory } = await import('@/lib/db/models/Memory');
            const recentMemories = await Memory.find({ userId: { $in: [dbUser._id, dbUser._id.toString()] } }).sort({ createdAt: -1 }).limit(10);
            
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

    // Ensure we respect the actual plan assigned in the database for accurate limit testing.
    const isGeminiRequested = requestedModel.includes("gemini");
    if (userPlan === "free" && isGeminiRequested) {
      return NextResponse.json(
        { error: `The ${requestedModel} model is restricted to paid plans. Please upgrade.` },
        { status: 403 }
      );
    }

    let ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";

    if (!dbUser) {
      try {
        await connectDB();
        const limits = getPlanLimits("free");
        const now = new Date();
        
        let anonUsage = await AnonymousUsage.findOne({ ip });
        if (!anonUsage) {
          anonUsage = await AnonymousUsage.create({ ip });
        }

        const lastMonthlyReset = anonUsage.lastMonthlyResetDate || new Date(0);
        const isNewMonth = now.getMonth() !== lastMonthlyReset.getMonth() || now.getFullYear() !== lastMonthlyReset.getFullYear();

        const lastDailyReset = anonUsage.lastDailyResetDate || new Date(0);
        const isNewDay = now.getDate() !== lastDailyReset.getDate() || now.getMonth() !== lastDailyReset.getMonth() || now.getFullYear() !== lastDailyReset.getFullYear();

        const monthlyTokens = isNewMonth ? 0 : anonUsage.tokensUsedThisMonth;
        const dailyTokens = isNewDay ? 0 : (anonUsage.tokensUsedToday || 0);

        if (isNewMonth || isNewDay) {
          const updates: any = {};
          if (isNewMonth) {
            updates.tokensUsedThisMonth = 0;
            updates.lastMonthlyResetDate = now;
          }
          if (isNewDay) {
            updates.tokensUsedToday = 0;
            updates.lastDailyResetDate = now;
          }
          await AnonymousUsage.updateOne({ ip }, { $set: updates });
        }

        if (dailyTokens >= 2000) {
          return NextResponse.json({ error: `You have reached your daily free trial limit of 2,000 tokens. Please log in to enjoy your full monthly limits.` }, { status: 403 });
        }

        if (monthlyTokens >= limits.monthlyTokens) {
          return NextResponse.json({ error: `You have reached your free trial limit of ${limits.monthlyTokens.toLocaleString()} tokens. Please log in to continue.` }, { status: 403 });
        }
      } catch (e) {
        console.error("Failed to check anonymous usage:", e);
      }
    }

    // Limit Enforcement
    if (dbUser) { 
      const limits = getPlanLimits(userPlan as string);

      // Reset logic
      const now = new Date();
      const lastMonthlyReset = dbUser.usage?.lastMonthlyResetDate || new Date(0);
      const isNewMonth = now.getMonth() !== lastMonthlyReset.getMonth() || now.getFullYear() !== lastMonthlyReset.getFullYear();
      const monthlyTokens = isNewMonth ? 0 : (dbUser.usage?.tokensUsedThisMonth || 0);

      const lastDailyReset = dbUser.usage?.lastResetDate || new Date(0);
      const isNewDay = now.getDate() !== lastDailyReset.getDate() || now.getMonth() !== lastDailyReset.getMonth() || now.getFullYear() !== lastDailyReset.getFullYear();
      
      if (isNewMonth || isNewDay) {
        const updates: any = {};
        if (isNewMonth) {
          updates['usage.tokensUsedThisMonth'] = 0;
          updates['usage.messagesUsedThisMonth'] = 0;
          updates['usage.websiteGenerationsUsed'] = 0;
          updates['usage.lastMonthlyResetDate'] = now;
        }
        if (isNewDay) {
          updates['usage.tokensUsedToday'] = 0;
          updates['usage.messagesUsedToday'] = 0;
          updates['usage.filesUsedToday'] = 0;
          updates['usage.lastResetDate'] = now;
        }
        await User.updateOne({ _id: dbUser._id }, { $set: updates });
      }

      if (monthlyTokens >= limits.monthlyTokens) {
        return NextResponse.json({ error: `You have reached your monthly limit of ${limits.monthlyTokens.toLocaleString()} tokens on the ${limits.name.toUpperCase()} plan. Please upgrade your plan to continue chatting.` }, { status: 403 });
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
      userId: dbUser ? dbUser._id.toString() : session?.user?.id,
      ip,
      chatId: chatId || undefined,
      isTemporaryChat: isTemporaryChat || false,
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
