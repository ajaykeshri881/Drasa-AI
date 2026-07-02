import { NextResponse } from "next/server";
import { auth } from "@/features/auth/lib/auth";
import { documentQueue, memoryQueue, longTaskQueue, embeddingQueue } from "@/lib/queue/queues";

const queues: Record<string, any> = {
  DocumentQueue: documentQueue,
  MemoryQueue: memoryQueue,
  LongTaskQueue: longTaskQueue,
  EmbeddingQueue: embeddingQueue,
};

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const queueStats: Record<string, any> = {};

    for (const [name, queue] of Object.entries(queues)) {
      try {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
        ]);

        // Get recent jobs
        let recentJobs: any[] = [];
        try {
          const jobs = await queue.getJobs(['completed', 'failed', 'active', 'waiting'], 0, 5);
          recentJobs = await Promise.all(
            jobs.map(async (job: any) => ({
              id: job.id,
              name: job.name,
              state: await job.getState(),
              progress: job.progress,
              failedReason: job.failedReason,
              timestamp: job.timestamp,
              finishedOn: job.finishedOn,
            }))
          );
        } catch (e) {
          // Jobs fetching can fail silently
        }

        queueStats[name] = { waiting, active, completed, failed, delayed, recentJobs };
      } catch (err: any) {
        queueStats[name] = { error: err.message };
      }
    }

    return NextResponse.json({ queueStats });

  } catch (error: any) {
    console.error("Admin Queues GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch queue stats" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, queueName, jobId } = body;

    if (!action || !queueName) {
      return NextResponse.json({ error: "action and queueName are required" }, { status: 400 });
    }

    const queue = queues[queueName];
    if (!queue) {
      return NextResponse.json({ error: "Invalid queue name" }, { status: 400 });
    }

    if (action === "retry" && jobId) {
      const job = await queue.getJob(jobId);
      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      await job.retry();
      return NextResponse.json({ success: true, message: `Job ${jobId} retried` });
    }

    if (action === "clean") {
      await queue.clean(0, 100, "failed");
      return NextResponse.json({ success: true, message: `Failed jobs cleaned from ${queueName}` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("Admin Queues POST Error:", error);
    return NextResponse.json({ error: "Failed to perform queue action" }, { status: 500 });
  }
}
