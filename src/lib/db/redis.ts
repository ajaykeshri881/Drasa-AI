import { Redis } from "ioredis";

/**
 * Lazy Redis singleton. The connection is NOT established at module load time.
 * Call `getRedis()` when you need to use Redis — it will throw only if REDIS_URL
 * is missing at that point, not on every Next.js server boot.
 */
class RedisClient {
  private static instance: Redis | null = null;

  private constructor() {}

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      const url = process.env.REDIS_URL;
      if (!url) {
        throw new Error(
          "REDIS_URL is not defined in environment variables. Please add it to your .env.local file."
        );
      }

      RedisClient.instance = new Redis(url, {
        maxRetriesPerRequest: null,
      });

      RedisClient.instance.on("error", (error) => {
        console.error("Redis Connection Error:", error);
      });

      RedisClient.instance.on("connect", () => {
        console.log("🟢 Successfully connected to Redis");
      });
    }

    return RedisClient.instance;
  }
}

/**
 * Call this function to get the Redis client.
 * It initializes lazily — only when first called.
 */
export function getRedis(): Redis {
  return RedisClient.getInstance();
}

// Legacy named export for any existing imports. Prefer getRedis() for new code.
export const redis = {
  get: (...args: Parameters<Redis["get"]>) => getRedis().get(...args),
  set: (...args: Parameters<Redis["set"]>) => getRedis().set(...args),
  del: (...args: Parameters<Redis["del"]>) => getRedis().del(...args),
  exists: (...args: Parameters<Redis["exists"]>) => getRedis().exists(...args),
};

/**
 * Check Redis health by performing a PING. Returns connection status and latency.
 */
export async function checkRedisHealth(): Promise<{
  status: "operational" | "degraded" | "down";
  latencyMs: number;
  error?: string;
}> {
  try {
    const client = getRedis();
    const start = Date.now();
    const pong = await client.ping();
    const latencyMs = Date.now() - start;

    if (pong === "PONG") {
      return {
        status: latencyMs > 500 ? "degraded" : "operational",
        latencyMs,
      };
    }
    return { status: "degraded", latencyMs, error: `Unexpected response: ${pong}` };
  } catch (error: any) {
    return { status: "down", latencyMs: -1, error: error.message };
  }
}
