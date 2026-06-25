import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../lib/queue/config';
import { DocumentJobData, EmbeddingJobData, MemoryJobData, LongTaskJobData } from '../lib/queue/producers';

// Import processors
import { processDocument } from './processors/documentProcessor';
import { processEmbedding } from './processors/embeddingProcessor';
import { processMemory } from './processors/memoryProcessor';
import { processLongTask } from './processors/longTaskProcessor';

console.log('👷 Starting BullMQ Workers...');

// Create dedicated connections for workers
const documentConnection = createRedisConnection() as any;
const memoryConnection = createRedisConnection() as any;
const longTaskConnection = createRedisConnection() as any;
const embeddingConnection = createRedisConnection() as any;

// Initialize Workers
const documentWorker = new Worker<DocumentJobData>(
    'DocumentQueue',
    async (job: Job<DocumentJobData>) => {
        console.log(`[DocumentWorker] Processing job ${job.id} for user ${job.data.userId}`);
        return await processDocument(job);
    },
    { connection: documentConnection, concurrency: 2 }
);

const memoryWorker = new Worker<MemoryJobData>(
    'MemoryQueue',
    async (job: Job<MemoryJobData>) => {
        console.log(`[MemoryWorker] Processing job ${job.id} for chat ${job.data.chatId}`);
        return await processMemory(job);
    },
    { connection: memoryConnection, concurrency: 5 } // Can handle more concurrent memory extractions
);

const longTaskWorker = new Worker<LongTaskJobData>(
    'LongTaskQueue',
    async (job: Job<LongTaskJobData>) => {
        console.log(`[LongTaskWorker] Processing task ${job.data.taskType} - job ${job.id}`);
        return await processLongTask(job);
    },
    { connection: longTaskConnection, concurrency: 2 } // Heavy AI tasks, limit concurrency
);

const embeddingWorker = new Worker<EmbeddingJobData>(
    'EmbeddingQueue',
    async (job: Job<EmbeddingJobData>) => {
        console.log(`[EmbeddingWorker] Processing chunk ${job.data.chunkId} for doc ${job.data.documentId}`);
        return await processEmbedding(job);
    },
    { connection: embeddingConnection, concurrency: 10 } // Embeddings can usually be batched/concurrent
);

// Setup Error and Completion Handlers
const workers = [documentWorker, memoryWorker, longTaskWorker, embeddingWorker];

workers.forEach(worker => {
    worker.on('completed', (job) => {
        console.log(`✅ [${worker.name}] Job ${job.id} has completed successfully`);
    });

    worker.on('failed', (job, err) => {
        console.error(`❌ [${worker.name}] Job ${job?.id} failed:`, err.message);
    });
});

// Handle graceful shutdown
const gracefulShutdown = async () => {
    console.log('Stopping workers gracefully...');
    await Promise.all(workers.map(w => w.close()));
    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

console.log('✅ Workers are running and listening for jobs.');
