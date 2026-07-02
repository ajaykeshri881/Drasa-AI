import { Pinecone } from "@pinecone-database/pinecone";

// Google gemini-embedding-2 outputs 768 dimensions
const VECTOR_DIM = 768; 

let pineconeClient: Pinecone | null = null;

function getPineconeClient() {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ PINECONE_API_KEY is not set. Vector search will be disabled.");
      return null;
    }
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}

function getPineconeIndex() {
  const client = getPineconeClient();
  if (!client) return null;
  
  const indexName = process.env.PINECONE_INDEX || "drasa-ai-memories";
  return client.Index(indexName);
}

/**
 * Generate a 768-dimension embedding using Google's gemini-embedding-2 model.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/gemini-embedding-2",
          content: { parts: [{ text }] },
          outputDimensionality: 768
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
 * Upsert a memory into the Pinecone vector store.
 */
export async function upsertMemory(
  userId: string,
  memoryId: string,
  content: string,
  category: string
): Promise<boolean> {
  try {
    const index = getPineconeIndex();
    if (!index) return false;

    const vector = await generateEmbedding(content);

    // Pinecone SDK typing allows array directly, but to satisfy the UpsertOptions error we can cast
    await index.upsert({
      records: [
        {
          id: memoryId,
          values: vector,
          metadata: {
            userId,
            content,
            category,
            createdAt: Date.now(),
          },
        },
      ]
    });

    return true;
  } catch (error) {
    console.error("Pinecone vector upsert error:", error);
    return false;
  }
}

/**
 * Query memories from the Pinecone vector store using KNN semantic search.
 */
export async function queryMemories(
  userId: string,
  query: string,
  topK: number = 5
): Promise<Array<{ id: string; content: string; category: string; score: number }>> {
  // Race against a 3-second timeout so a slow Pinecone/embedding call never blocks chat
  const timeoutPromise = new Promise<Array<{ id: string; content: string; category: string; score: number }>>(
    (resolve) => setTimeout(() => resolve([]), 3000)
  );

  const queryPromise = (async () => {
    try {
      const index = getPineconeIndex();
      if (!index) return [];

      const vector = await generateEmbedding(query);

      const queryResponse = await index.query({
        vector,
        topK,
        includeMetadata: true,
        filter: {
          userId: { $eq: userId }
        }
      });

      if (!queryResponse.matches || queryResponse.matches.length === 0) {
        return [];
      }

      const memories = queryResponse.matches.map((match) => ({
        id: match.id,
        content: match.metadata?.content as string || "",
        category: match.metadata?.category as string || "fact",
        score: match.score || 0,
      }));

      return memories;
    } catch (error) {
      console.error("Pinecone vector query error:", error);
      return [];
    }
  })();

  return Promise.race([queryPromise, timeoutPromise]);
}

/**
 * Delete a specific memory vector by its ID.
 */
export async function deleteMemory(memoryId: string): Promise<boolean> {
  try {
    const index = getPineconeIndex();
    if (!index) return false;

    // Use deleteMany with array of IDs to avoid SDK version incompatibilities
    await index.deleteMany([memoryId]);
    return true;
  } catch (error) {
    console.error("Pinecone vector delete error:", error);
    return false;
  }
}

/**
 * Delete all memories for a specific user.
 * Note: Pinecone SDK supports deleteMany by filter or IDs.
 * Since we might not have all IDs, we delete by metadata filter (if supported) 
 * or iterate and delete all if fetched.
 * The safest approach for this MVP is to require IDs or just let the caller handle it.
 */
export async function deleteAllMemoriesForUser(userId: string): Promise<boolean> {
  try {
    const index = getPineconeIndex();
    if (!index) return false;

    // Pinecone allows deleteMany with filter in Starter/Serverless plans.
    // However, the Node SDK syntax requires a filter object
    await index.deleteMany({ filter: { userId: { $eq: userId } } } as any);
    
    return true;
  } catch (error) {
    console.error("Pinecone deleteAll error:", error);
    return false;
  }
}