import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { Payment } from "@/lib/db/models/Subscription";
import { checkRedisHealth } from "@/lib/db/redis";
import { documentQueue, memoryQueue, longTaskQueue, embeddingQueue } from "@/lib/queue/queues";

export async function GET() {
  try {
    const session = await auth();
    
    // Require admin authentication
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // User stats
    const totalUsers = await User.countDocuments();
    const activeProPlans = await User.countDocuments({ plan: { $in: ["pro", "ultimate"] } });

    // Aggregate today's message usage
    const usageStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalMessagesToday: { $sum: "$usage.messagesUsedToday" }
        }
      }
    ]);
    const messagesToday = usageStats.length > 0 ? usageStats[0].totalMessagesToday : 0;

    // Payment/revenue stats
    let totalRevenue = 0;
    let totalPayments = 0;
    try {
      const revenueStats = await Payment.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
      ]);
      if (revenueStats.length > 0) {
        totalRevenue = revenueStats[0].total / 100; // Convert paise to INR
        totalPayments = revenueStats[0].count;
      }
    } catch (e) {
      console.warn("Could not fetch payment stats:", e);
    }

    // Redis health check
    let redisStatus = "unknown";
    let redisLatency = -1;
    try {
      const health = await checkRedisHealth();
      redisStatus = health.status;
      redisLatency = health.latencyMs;
    } catch (e) {
      redisStatus = "down";
    }

    // BullMQ queue stats
    const queueStats: Record<string, any> = {};
    try {
      const queues = [
        { name: "DocumentQueue", queue: documentQueue },
        { name: "MemoryQueue", queue: memoryQueue },
        { name: "LongTaskQueue", queue: longTaskQueue },
        { name: "EmbeddingQueue", queue: embeddingQueue },
      ];

      for (const { name, queue } of queues) {
        try {
          const [waiting, active, completed, failed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
          ]);
          queueStats[name] = { waiting, active, completed, failed };
        } catch (qErr) {
          queueStats[name] = { error: "Could not fetch stats" };
        }
      }
    } catch (e) {
      console.warn("Could not fetch queue stats:", e);
    }

    // Calculate error rate from queue failures
    let totalJobs = 0;
    let totalFailed = 0;
    for (const stat of Object.values(queueStats)) {
      if (stat.completed !== undefined) {
        totalJobs += (stat.completed || 0) + (stat.failed || 0);
        totalFailed += stat.failed || 0;
      }
    }
    const errorRate = totalJobs > 0 ? `${((totalFailed / totalJobs) * 100).toFixed(2)}%` : "0.00%";

    // System service statuses
    const services = [
      { name: "AI Gateway", status: "operational" },
      { name: "MongoDB", status: "operational" },
      { name: "Auth Service", status: "operational" },
      { name: "Payment Gateway", status: "operational" },
      { name: "Redis Cache", status: redisStatus },
      { name: "BullMQ Workers", status: Object.values(queueStats).some((s: any) => s.error) ? "degraded" : "operational" },
    ];

    return NextResponse.json({
      totalUsers,
      activeProPlans,
      messagesToday,
      systemErrorRate: errorRate,
      totalRevenue,
      totalPayments,
      redisStatus,
      redisLatency,
      queueStats,
      services,
    });

  } catch (error: any) {
    console.error("Admin Stats API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
