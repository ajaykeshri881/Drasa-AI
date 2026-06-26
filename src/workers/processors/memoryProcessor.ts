import { Job } from 'bullmq';
import { MemoryJobData } from '../../lib/queue/producers';

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
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey || apiKey === "your_openrouter_api_key_here") {
            throw new Error('No OpenRouter API key available for memory extraction');
        }

        const response = await fetch(
            `https://openrouter.ai/api/v1/chat/completions`,
            {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-3.1-8b-instruct:free',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a data extraction AI. Return ONLY a JSON array of objects with "content" (the memory) and "category" (one of: "preference", "fact", "rule", "project_context"). If nothing is worth remembering, return an empty array []. Do not output any markdown formatting or explanatory text.'
                        },
                        {
                            role: 'user',
                            content: `Analyze this conversation and extract any important facts, user preferences, rules, or project context that should be remembered for future conversations.\n\nConversation:\n${conversationText}`
                        }
                    ],
                    temperature: 0.1,
                }),
            }
        );

        if (response.ok) {
            const data = await response.json();
            const responseText = data.choices?.[0]?.message?.content || '[]';
            
            // Parse the JSON from the response
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                try {
                    extractedMemories = JSON.parse(jsonMatch[0]);
                } catch (parseErr) {
                    console.warn(`[Job ${job.id}] Could not parse AI response as JSON`);
                }
            } else {
                // Attempt raw parse just in case
                try {
                    extractedMemories = JSON.parse(responseText);
                } catch (e) {}
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

        const { Memory } = await import('../../lib/db/models/Memory');
        const { upsertMemory } = await import('../../lib/ai/memory/vector-store');

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
