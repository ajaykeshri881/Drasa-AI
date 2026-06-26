import { getRedis } from "../../db/redis";

const INDEX_NAME = "idx:memories";
const KEY_PREFIX = "memory:";
const VECTOR_DIM = 768; // Google text-embedding-004 outputs 768 dimensions

let indexInitialized = false;

/**
 * Lazily ensure the RediSearch vector index exists.
 * If the Redis instance doesn't support FT.CREATE (e.g. plain Redis without
 * the Search module), this will log a warning and silently degrade —
 * upserts will still store hash data, but queries will return empty results.
 */
async function ensureIndex(): Promise<boolean> {
  if (indexInitialized) return true;

  try {
    const redis = getRedis();

    // Check if the index already exists
    try {
      await redis.call("FT.INFO", INDEX_NAME);
      indexInitialized = true;
      return true;
    } catch {
      // Index doesn't exist yet — create it below
    }

    await redis.call(
      "FT.CREATE",
      INDEX_NAME,
      "ON",
      "HASH",
      "PREFIX",
      "1",
      KEY_PREFIX,
      "SCHEMA",
      "userId",
      "TAG",
      "content",
      "TEXT",
      "category",
      "TAG",
      "vector",
      "VECTOR",
      "HNSW",
      "6",
      "TYPE",
      "FLOAT32",
      "DIM",
      String(VECTOR_DIM),
      "DISTANCE_METRIC",
      "COSINE"
    );

    console.log("🟢 Redis vector index created:", INDEX_NAME);
    indexInitialized = true;
    return true;
  } catch (error) {
    console.warn(
      "⚠️ Could not create Redis vector index (RediSearch module may not be available):",
      (error as Error).message
    );
    return false;
  }
}

/**
 * Generate a 768-dimension embedding using Google's text-embedding-004 model.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text }] },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Google API error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    return data.embedding.values;
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    throw error;
  }
}

/**
 * Convert a number[] vector to a Buffer for storage in Redis HASH fields.
 */
function vectorToBuffer(vector: number[]): Buffer {
  return Buffer.from(new Float32Array(vector).buffer);
}

/**
 * Upsert a memory into the Redis vector store.
 * Stores the memory as a Redis HASH with text fields and a binary vector field.
 */
export async function upsertMemory(
  userId: string,
  memoryId: string,
  content: string,
  category: string
): Promise<boolean> {
  try {
    const redis = getRedis();
    const vector = await generateEmbedding(content);
    const key = `${KEY_PREFIX}${memoryId}`;

    await redis.hset(key, {
      userId,
      content,
      category,
      createdAt: String(Date.now()),
      vector: vectorToBuffer(vector) as unknown as string, // ioredis accepts Buffer here
    });

    // Attempt to ensure the index exists (non-blocking for the upsert itself)
    ensureIndex().catch(() => {});

    return true;
  } catch (error) {
    console.error("Redis vector upsert error:", error);
    return false;
  }
}

/**
 * Query memories from the Redis vector store using KNN semantic search.
 * Falls back to returning an empty array if the index is unavailable.
 */
export async function queryMemories(
  userId: string,
  query: string,
  topK: number = 5
): Promise<Array<{ id: string; content: string; category: string; score: number }>> {
  // Race against a 3-second timeout so a slow Redis/embedding call never blocks chat
  const timeoutPromise = new Promise<Array<{ id: string; content: string; category: string; score: number }>>(
    (resolve) => setTimeout(() => resolve([]), 3000)
  );

  const queryPromise = (async () => {
    try {
      const hasIndex = await ensureIndex();
      if (!hasIndex) return [];

      const redis = getRedis();
      const vector = await generateEmbedding(query);
      const vectorBuffer = vectorToBuffer(vector);

      // Escape special characters in userId for TAG filter
      const escapedUserId = userId.replace(/[^a-zA-Z0-9]/g, "\\$&");

      const results = (await redis.call(
        "FT.SEARCH",
        INDEX_NAME,
        `@userId:{${escapedUserId}}=>[KNN ${topK} @vector $vec_param AS score]`,
        "PARAMS",
        "2",
        "vec_param",
        vectorBuffer,
        "SORTBY",
        "score",
        "ASC",
        "LIMIT",
        "0",
        String(topK),
        "DIALECT",
        "2"
      )) as any[];

      // FT.SEARCH returns: [totalCount, key1, [field1, val1, ...], key2, [...], ...]
      if (!results || results[0] === 0) return [];

      const memories: Array<{ id: string; content: string; category: string; score: number }> = [];

      for (let i = 1; i < results.length; i += 2) {
        const key = results[i] as string;
        const fields = results[i + 1] as string[];

        if (!fields) continue;

        const fieldMap: Record<string, string> = {};
        for (let j = 0; j < fields.length; j += 2) {
          fieldMap[fields[j]] = fields[j + 1];
        }

        if (fieldMap.content) {
          memories.push({
            id: key.replace(KEY_PREFIX, ""),
            content: fieldMap.content,
            category: fieldMap.category || "fact",
            score: fieldMap.score ? parseFloat(fieldMap.score) : 0,
          });
        }
      }

      return memories;
    } catch (error) {
      console.error("Redis vector query error:", error);
      return [];
    }
  })();

  return Promise.race([queryPromise, timeoutPromise]);
}