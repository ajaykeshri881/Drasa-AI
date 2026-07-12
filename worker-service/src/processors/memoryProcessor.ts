import { Job } from 'bullmq';
import { MemoryJobData } from '../queue/producers';

/**
 * Real memory processor — uses AI to analyze conversation messages
 * and extract semantic memories (preferences, facts, rules).
 * Stores extracted memories in the Memory MongoDB collection.
 */
export async function processMemory(job: Job<MemoryJobData>): Promise<any> {
    const { userId, chatId, messages } = job.data;

    // Step 1: Prepare conversation for analysis
    await job.updateProgress(20);
    console.log(`[Job ${job.id}] Analyzing ${messages.length} messages for user ${userId}...`);

    // Format messages for the AI prompt
    const conversationText = messages
        .map((m: any) => `${m.role}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
        .join('\n')
        .substring(0, 4000); // Limit to avoid token overflow

    // Step 2: Extract memories using AI
    await job.updateProgress(50);
    console.log(`[Job ${job.id}] Extracting semantic memories via AI...`);

    let extractedMemories: Array<{ content: string; category: string }> = [];

    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            throw new Error('No Google API key available for memory extraction');
        }

        const prompt = `You are a comprehensive memory extraction AI. Your task is to analyze the following conversation and extract all important facts, user preferences, rules, or project context that would be helpful to remember for future interactions.
Be extremely thorough. Extract even minor preferences or contextual details.

Return exactly a JSON array of objects, where each object has:
- "content": A clear, concise statement of the memory (e.g., "User prefers dark mode", "User is building a React app")
- "category": Must be one of ["preference", "fact", "rule", "project_context"]

If there is absolutely nothing worth remembering, return []. Do not include any markdown blocks.

Conversation:
${conversationText}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: prompt }] }
                    ],
                    generationConfig: {
                        temperature: 0.2,
                        responseMimeType: "application/json"
                    }
                }),
            }
        );

        if (response.ok) {
            const data = await response.json();
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
            
            try {
                extractedMemories = JSON.parse(responseText);
            } catch (parseErr) {
                console.warn(`[Job ${job.id}] Could not parse AI response as JSON`);
            }
        } else {
            const errText = await response.text();
            console.warn(`[Job ${job.id}] Memory extraction API returned ${response.status}: ${errText}`);
        }
    } catch (err: any) {
        console.warn(`[Job ${job.id}] AI memory extraction failed:`, err.message);
    }

    if (extractedMemories.length === 0) {
        await job.updateProgress(100);
        return {
            success: true,
            chatId,
            memoriesExtracted: 0,
            message: "No actionable memories found in this conversation.",
        };
    }

    // Step 3: Save extracted memories to MongoDB
    await job.updateProgress(80);
    console.log(`[Job ${job.id}] Saving ${extractedMemories.length} memories...`);

    let savedCount = 0;
    try {
        const mongoose = (await import('mongoose')).default;
        const MONGODB_URI = process.env.MONGODB_URI;
        
        if (MONGODB_URI && mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGODB_URI);
        }

        const { Memory } = await import('../lib/db/models/Memory');
        const { upsertMemory } = await import('../lib/ai/memory/vector-store');

        for (const mem of extractedMemories) {
            const validCategories = ['preference', 'fact', 'rule', 'project_context'];
            const category = validCategories.includes(mem.category) ? mem.category : 'fact';

            try {
                const vectorId = `auto_${Date.now()}_${Math.random().toString(36).substring(7)}`;

                await Memory.create({
                    userId: new mongoose.Types.ObjectId(userId as string),
                    content: mem.content,
                    category,
                    pineconeId: vectorId, // Used as Redis vector key
                    sourceChatId: chatId,
                });

                // Upsert into Redis vector store for semantic search
                await upsertMemory(userId, vectorId, mem.content, category).catch((vecErr: any) => {
                    console.warn(`[Job ${job.id}] Vector upsert failed (non-fatal):`, vecErr.message);
                });

                savedCount++;
            } catch (saveErr: any) {
                // Skip duplicates or invalid entries
                console.warn(`[Job ${job.id}] Could not save memory:`, saveErr.message);
            }
        }
    } catch (dbError: any) {
        console.warn(`[Job ${job.id}] DB connection failed for memory save:`, dbError.message);
    }

    await job.updateProgress(100);
    return {
        success: true,
        chatId,
        memoriesExtracted: extractedMemories.length,
        memoriesSaved: savedCount,
        memories: extractedMemories.map(m => m.content),
        message: `Extracted ${extractedMemories.length} memories, saved ${savedCount}.`,
    };
}
