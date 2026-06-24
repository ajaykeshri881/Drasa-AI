import { Redis } from 'ioredis';

const url = process.env.REDIS_URL;

/**
 * Create a dedicated Redis connection for BullMQ.
 * BullMQ requires separate connections for Queue, Worker, and Events
 * to prevent blocking operations from deadlocking.
 */
export function createRedisConnection(): Redis {
    if (!url) {
      throw new Error("REDIS_URL is not defined in environment variables. Please add it to your .env.local file.");
    }
    return new Redis(url, {
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false
    });
}

/**
 * Lazy singleton for queue producer connections.
 * Workers MUST use their own connections via createRedisConnection().
 */
let _queueConnection: Redis | null = null;

export function getQueueConnection(): Redis {
  if (!_queueConnection) {
    _queueConnection = createRedisConnection();
  }
  return _queueConnection;
}

// Keep backward compat — but now lazy
export const queueConnection = {
  get instance() { return getQueueConnection(); }
} as any;
