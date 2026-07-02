import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { AnonymousUsage } from "@/lib/db/models/AnonymousUsage";
import { getPlanLimits } from "@/lib/config/plans";
import { NextResponse } from "next/server";

export async function enforcePlanLimits(dbUser: any, userPlan: string, ip: string, requestedModel: string) {
  const isGeminiRequested = requestedModel.includes("gemini");
  
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

      const nextDay = new Date(now);
      nextDay.setDate(now.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);
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

  // Enforce logged-in user limits
  const limits = getPlanLimits(userPlan);

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
  
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const resetNextMonth = nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  if (monthlyTokens >= limits.monthlyTokens) {
    return NextResponse.json({ error: `You have reached your monthly limit of ${limits.monthlyTokens.toLocaleString()} tokens on the ${limits.name.toUpperCase()} plan. Your limit will reset on ${resetNextMonth}. Please upgrade to Premium to continue chatting without interruptions.` }, { status: 403 });
  }

  return null;
}
