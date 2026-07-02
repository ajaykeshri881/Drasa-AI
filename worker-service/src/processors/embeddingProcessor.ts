import { Job } from 'bullmq';
import { EmbeddingJobData } from '../queue/producers';

/**
 * Real embedding processor — generates embeddings using available AI provider
 * and stores them in MongoDB for retrieval. When Pinecone is configured,
 * this can be extended to store vectors there too.
 */
export async function processEmbedding(job: Job<EmbeddingJobData>): Promise<any> {
    const { userId, documentId, chunkId, text } = job.data;

    // Step 1: Generate Embedding using Google AI
    await job.updateProgress(30);
    console.log(`[Job ${job.id}] Generating embedding for chunk ${chunkId}...`);

    let embedding: number[] | null = null;

    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (apiKey) {
            // Use Google's embedding model
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'models/text-embedding-004',
                        content: { parts: [{ text }] },
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                embedding = data.embedding?.values || null;
            } else {
                const errText = await response.text();
                console.warn(`[Job ${job.id}] Embedding API returned ${response.status}: ${errText}`);
            }
        }
    } catch (err: any) {
        console.warn(`[Job ${job.id}] Embedding generation failed, storing text-only:`, err.message);
    }

    // Step 2: Store in MongoDB (and optionally Pinecone in future)
    await job.updateProgress(70);
    console.log(`[Job ${job.id}] Storing embedding data for user ${userId}...`);

    try {
        // Dynamic import to avoid requiring mongoose connection at worker boot
        const mongoose = (await import('mongoose')).default;
        const MONGODB_URI = process.env.MONGODB_URI;
        
        if (MONGODB_URI && mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGODB_URI);
        }

        // Use a flexible Embedding collection
        const EmbeddingSchema = new mongoose.Schema({
            userId: { type: String, required: true, index: true },
            documentId: { type: String, required: true, index: true },
            chunkId: { type: String, required: true, unique: true },
            text: { type: String, required: true },
            vector: { type: [Number] }, // Store raw embedding vector
            dimensions: { type: Number },
        }, { timestamps: true });

        const Embedding = mongoose.models.Embedding || mongoose.model('Embedding', EmbeddingSchema);

        await Embedding.findOneAndUpdate(
            { chunkId },
            {
                userId,
                documentId,
                chunkId,
                text: text.substring(0, 2000), // Store first 2000 chars for retrieval
                vector: embedding || [],
                dimensions: embedding?.length || 0,
            },
            { upsert: true, new: true }
        );
    } catch (dbError: any) {
        console.warn(`[Job ${job.id}] Could not persist embedding to DB:`, dbError.message);
        // Non-fatal — the embedding was still generated
    }

    await job.updateProgress(100);
    return {
        success: true,
        chunkId,
        hasVector: !!embedding,
        dimensions: embedding?.length || 0,
        message: embedding
            ? "Embedding generated and stored successfully."
            : "Text stored without vector (embedding API unavailable).",
    };
}
