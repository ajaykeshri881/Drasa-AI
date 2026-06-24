import { Queue, DefaultJobOptions } from 'bullmq';
import { getQueueConnection } from './config';

const defaultJobOptions: DefaultJobOptions = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 2000,
    },
    removeOnComplete: {
        age: 3600 * 24, // Keep completed jobs for 24 hours for tracking
        count: 1000,
    },
    removeOnFail: {
        age: 3600 * 24 * 7, // Keep failed jobs for 7 days
    },
};

// Lazy queue singletons — only connect when first accessed
let _documentQueue: Queue | null = null;
let _memoryQueue: Queue | null = null;
let _longTaskQueue: Queue | null = null;
let _embeddingQueue: Queue | null = null;

export const documentQueue = new Proxy({} as Queue, {
    get(_, prop) {
        if (!_documentQueue) {
            _documentQueue = new Queue('DocumentQueue', { connection: getQueueConnection() as any, defaultJobOptions });
        }
        return (_documentQueue as any)[prop];
    }
});

export const memoryQueue = new Proxy({} as Queue, {
    get(_, prop) {
        if (!_memoryQueue) {
            _memoryQueue = new Queue('MemoryQueue', { connection: getQueueConnection() as any, defaultJobOptions });
        }
        return (_memoryQueue as any)[prop];
    }
});

export const longTaskQueue = new Proxy({} as Queue, {
    get(_, prop) {
        if (!_longTaskQueue) {
            _longTaskQueue = new Queue('LongTaskQueue', { connection: getQueueConnection() as any, defaultJobOptions });
        }
        return (_longTaskQueue as any)[prop];
    }
});

export const embeddingQueue = new Proxy({} as Queue, {
    get(_, prop) {
        if (!_embeddingQueue) {
            _embeddingQueue = new Queue('EmbeddingQueue', { connection: getQueueConnection() as any, defaultJobOptions });
        }
        return (_embeddingQueue as any)[prop];
    }
});
