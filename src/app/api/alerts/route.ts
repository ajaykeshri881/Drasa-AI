import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth/auth";
import { User } from "@/lib/db/models/User";
import { Alert } from "@/lib/db/models/Admin";

export async function GET(req: Request) {
  try {
    await connectDB();
    const session = await auth();
    let userPlan = "free";

    // If logged in, get user plan
    if (session && session.user?.email) {
      const dbUser = await User.findOne({ email: session.user.email });
      if (dbUser) {
        userPlan = dbUser.plan || "free";
      }
    }

    const now = new Date();

    // Find active alerts
    // 1. isActive is true
    // 2. startsAt is in the past (or now)
    // 3. expiresAt is null OR in the future
    const query: any = {
      isActive: true,
      startsAt: { $lte: now },
      $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }]
    };

    const alerts = await Alert.find(query).sort({ priority: -1, createdAt: -1 }).lean();

    // Filter alerts by targetPlans if specified
    const filteredAlerts = alerts.filter(alert => {
      if (!alert.targetPlans || alert.targetPlans.length === 0) return true; // Applies to all
      return alert.targetPlans.includes(userPlan);
    });

    return NextResponse.json({ alerts: filteredAlerts });
  } catch (error) {
    console.error("Error fetching public alerts:", error);
    return NextResponse.json({ alerts: [] });
  }
}
