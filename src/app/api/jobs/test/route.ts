import { NextResponse } from 'next/server';
import { enqueueDocumentProcessing, enqueueLongTask } from '@/lib/queue/producers';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const type = body.type || 'document'; // 'document' or 'longTask'

        let job;

        if (type === 'document') {
            job = await enqueueDocumentProcessing({
                userId: 'test_user_123',
                fileName: 'test_document.pdf',
                mimeType: 'application/pdf',
                fileUrl: 'dummy_url',
            });
        } else {
            job = await enqueueLongTask({
                userId: 'test_user_123',
                taskType: 'website_generation',
                prompt: 'Build a landing page for a SaaS startup',
            });
        }

        return NextResponse.json({
            success: true,
            jobId: job.id,
            queueName: type === 'document' ? 'DocumentQueue' : 'LongTaskQueue',
            message: `Successfully queued ${type} job with ID ${job.id}`
        });

    } catch (error: any) {
        console.error('Test Job Route Error:', error);
        return NextResponse.json({ error: 'Failed to queue test job' }, { status: 500 });
    }
}
