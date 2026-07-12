import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { AnonymousUsage } from "@/lib/db/models/AnonymousUsage";
import { getPlanLimits } from "@/lib/config/plans";
import { getActiveModelConfigs } from "@/lib/ai/config";
import { NextResponse } from "next/server";

export async function enforcePlanLimits(dbUser: any, userPlan: string, ip: string, requestedModel: string) {
  if (requestedModel?.startsWith("ollama/")) {
    return null; // Local models bypass all limits
  }

  if (!dbUser) {
    // --- Anonymous / Guest user enforcement ---
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

      const resetTomorrow = "tomorrow at midnight";
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const resetNextMonth = nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

      if (dailyTokens >= 2000) {
        return NextResponse.json({ error: `You have reached your daily free trial limit of 2,000 tokens. Your limit will reset ${resetTomorrow}. Please log in or upgrade to Premium to enjoy full monthly limits.` }, { status: 403 });
      }

      if (monthlyTokens >= limits.monthlyTokens) {
        return NextResponse.json({ error: `You have reached your free trial limit of ${limits.monthlyTokens.toLocaleString()} tokens. Your limit will reset on ${resetNextMonth}. Please log in or upgrade to Premium to continue.` }, { status: 403 });
      }
    } catch (e) {
      console.error("Failed to check anonymous usage:", e);
    }
    return null;
  }

  // --- Logged-in user enforcement ---
  const limits = getPlanLimits(userPlan);

  // Block free-tier users from requesting premium models
  if (userPlan === "free" && requestedModel) {
    try {
      const activeModels = await getActiveModelConfigs();
      const requestedModelConfig = activeModels.find(m => m.modelId === requestedModel);
      if (requestedModelConfig?.isPremium) {
        return NextResponse.json(
          { error: `The ${requestedModelConfig.name} model is a premium feature. Please upgrade your plan to use it.` },
          { status: 403 }
        );
      }
    } catch (e) {
      console.error("Failed to check model tier:", e);
    }
  }

  // Reset logic
  const now = new Date();
  const lastMonthlyReset = dbUser.usage?.lastMonthlyResetDate || new Date(0);
  const isNewMonth = now.getMonth() !== lastMonthlyReset.getMonth() || now.getFullYear() !== lastMonthlyReset.getFullYear();
  const monthlyTokens = isNewMonth ? 0 : (dbUser.usage?.tokensUsedThisMonth || 0);

  const lastDailyReset = dbUser.usage?.lastResetDate || new Date(0);
  const isNewDay = now.getDate() !== lastDailyReset.getDate() || now.getMonth() !== lastDailyReset.getMonth() || now.getFullYear() !== lastDailyReset.getFullYear();
  const messagesUsedToday = isNewDay ? 0 : (dbUser.usage?.messagesUsedToday || 0);
  
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
  
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const resetNextMonth = nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  // Enforce daily message limit (if plan has a finite limit)
  if ((limits as any).dailyMessages > 0 && messagesUsedToday >= (limits as any).dailyMessages) {
    return NextResponse.json(
      { error: `You have reached your daily message limit of ${(limits as any).dailyMessages} messages on the ${limits.name.toUpperCase()} plan. Your limit will reset tomorrow at midnight.` },
      { status: 403 }
    );
  }

  // Enforce monthly token limit
  if (monthlyTokens >= limits.monthlyTokens) {
    return NextResponse.json({ error: `You have reached your monthly limit of ${limits.monthlyTokens.toLocaleString()} tokens on the ${limits.name.toUpperCase()} plan. Your limit will reset on ${resetNextMonth}. Please upgrade to Premium to continue chatting without interruptions.` }, { status: 403 });
  }

  return null;
}
