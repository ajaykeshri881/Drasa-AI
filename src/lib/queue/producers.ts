import { documentQueue, memoryQueue, longTaskQueue, embeddingQueue } from './queues';

// -- Types --

export interface DocumentJobData {
    userId: string;
    fileUrl?: string; // For testing, could be a path or a buffer reference
    filePath?: string;
    fileName: string;
    mimeType: string;
}

export interface MemoryJobData {
    userId: string;
    chatId: string;
    messages: any[]; // The messages from the chat to analyze
}

export interface LongTaskJobData {
    userId: string;
    taskType: 'website_generation' | 'research' | 'code_generation';
    prompt: string;
    context?: any;
}

export interface EmbeddingJobData {
    userId: string;
    documentId: string;
    chunkId: string;
    text: string;
}

// -- Producers --

export async function enqueueDocumentProcessing(data: DocumentJobData, priority: number = 2) {
    return await documentQueue.add('process-document', data, { priority });
}

export async function enqueueMemoryExtraction(data: MemoryJobData, priority: number = 3) {
    // Memory extraction is lower priority than active user tasks
    return await memoryQueue.add('extract-memory', data, { priority });
}

export async function enqueueLongTask(data: LongTaskJobData, priority: number = 1) {
    // High priority for tasks users are actively waiting on
    return await longTaskQueue.add('process-long-task', data, { priority });
}

export async function enqueueEmbedding(data: EmbeddingJobData, priority: number = 2) {
    return await embeddingQueue.add('generate-embedding', data, { priority });
}
