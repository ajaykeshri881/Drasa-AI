import { checkRedisHealth, getRedis } from "@/lib/db/redis";
import { getQueueConnection } from "@/lib/queue/config";
import { Pinecone } from "@pinecone-database/pinecone";

describe("Services Integration Tests", () => {
  // Increase timeout for external service connections
  jest.setTimeout(10000);

  afterAll(async () => {
    // Clean up connections
    const redis = getRedis();
    if (redis.status === 'ready' || redis.status === 'connecting') {
      await redis.quit();
    }
    const queueConn = getQueueConnection();
    if (queueConn.status === 'ready' || queueConn.status === 'connecting') {
      await queueConn.quit();
    }
  });

  describe("Redis Connection", () => {
    it("should connect to Redis and return operational status", async () => {
      const health = await checkRedisHealth();
      expect(health.status).not.toBe("down");
      if (health.status === "degraded") {
        console.warn(`Redis is degraded. Latency: ${health.latencyMs}ms. Error: ${health.error}`);
      }
      expect(health.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("BullMQ Connection (Redis)", () => {
    it("should successfully establish a dedicated queue connection", async () => {
      const queueConn = getQueueConnection();
      
      // We can ping this dedicated connection to make sure it works
      const pong = await queueConn.ping();
      expect(pong).toBe("PONG");
    });
  });

  describe("Pinecone Connection", () => {
    it("should initialize Pinecone client and list indexes if API key is valid", async () => {
      const apiKey = process.env.PINECONE_API_KEY;
      if (!apiKey) {
        console.warn("Skipping Pinecone test because PINECONE_API_KEY is not defined");
        return;
      }
      
      const pineconeClient = new Pinecone({ apiKey });
      
      try {
        const response = await pineconeClient.listIndexes();
        expect(response).toBeDefined();
        
        // Check if the required index exists
        const indexName = process.env.PINECONE_INDEX || "drasa-ai-memories";
        if (response.indexes && response.indexes.length > 0) {
            const indexExists = response.indexes.some(idx => idx.name === indexName);
            if (!indexExists) {
                console.warn(`Pinecone index '${indexName}' was not found in the list of indexes.`);
            }
        }
      } catch (error: any) {
        // If the key is invalid, this will throw
        throw new Error(`Failed to list Pinecone indexes. Is the API key valid? Error: ${error.message}`);
      }
    });
  });
});
