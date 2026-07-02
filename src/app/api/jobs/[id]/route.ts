import { NextResponse } from 'next/server';
import { Job } from 'bullmq';
import { documentQueue, memoryQueue, longTaskQueue, embeddingQueue } from '@/lib/queue/queues';
import { auth } from "@/features/auth/lib/auth";

// Map queue names to their instances
const queues: Record<string, any> = {
    'DocumentQueue': documentQueue,
    'MemoryQueue': memoryQueue,
    'LongTaskQueue': longTaskQueue,
    'EmbeddingQueue': embeddingQueue,
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const queueName = searchParams.get('queue') || 'DocumentQueue';
        const queue = queues[queueName];

        if (!queue) {
            return NextResponse.json({ error: 'Invalid queue name' }, { status: 400 });
        }

        const session = await auth();
        let userId = session?.user?.id;
        if (!userId) {
            const guestId = req.headers.get("x-guest-id");
            if (guestId) userId = guestId;
            else return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const job = await queue.getJob(id);

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        if (job.data?.userId && job.data.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const state = await job.getState();
        const progress = job.progress;
        const failedReason = job.failedReason;
        const result = job.returnvalue;

        return NextResponse.json({
            id: job.id,
            state,
            progress: typeof progress === 'number' ? progress : 0,
            failedReason,
            result,
        });
    } catch (error: any) {
        console.error('Error fetching job status:', error);
        return NextResponse.json({ error: 'Failed to fetch job status' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const queueName = searchParams.get('queue') || 'DocumentQueue';
        const queue = queues[queueName];

        if (!queue) {
            return NextResponse.json({ error: 'Invalid queue name' }, { status: 400 });
        }

        const session = await auth();
        let userId = session?.user?.id;
        if (!userId) {
            const guestId = req.headers.get("x-guest-id");
            if (guestId) userId = guestId;
            else return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const job = await queue.getJob(id);

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        if (job.data?.userId && job.data.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await job.remove();

        return NextResponse.json({ success: true, message: 'Job cancelled/removed' });
    } catch (error: any) {
        console.error('Error removing job:', error);
        return NextResponse.json({ error: 'Failed to remove job' }, { status: 500 });
    }
}
