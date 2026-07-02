import { Job } from 'bullmq';
import { LongTaskJobData } from '../queue/producers';

/**
 * Real long-task processor — handles heavy AI tasks like website generation,
 * research, and code generation using the Google Gemini API.
 */
export async function processLongTask(job: Job<LongTaskJobData>): Promise<any> {
    const { userId, taskType, prompt, context } = job.data;

    // Step 1: Initialize
    await job.updateProgress(10);
    console.log(`[Job ${job.id}] Starting long task: ${taskType} for user ${userId}`);

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is required for long task processing');
    }

    // Step 2: Build the system prompt based on task type
    await job.updateProgress(20);
    const systemPrompts: Record<string, string> = {
        website_generation: `You are an expert web developer. Generate a complete, production-ready single-page website using HTML, Tailwind CSS (via CDN), and vanilla JavaScript. The website should be modern, responsive, and visually stunning. Include proper meta tags, semantic HTML, and smooth animations. Return ONLY the complete HTML code starting with <!DOCTYPE html>.`,
        research: `You are a thorough researcher. Analyze the given topic comprehensively. Provide a well-structured report with: Executive Summary, Key Findings (with supporting evidence), Analysis, and Actionable Recommendations. Use markdown formatting.`,
        code_generation: `You are an expert software engineer. Generate clean, well-documented, production-ready code. Include error handling, type safety, and follow best practices for the requested language/framework. Add helpful comments explaining complex logic.`,
    };

    const systemPrompt = systemPrompts[taskType] || systemPrompts.research;

    // Step 3: Execute AI generation
    await job.updateProgress(40);
    console.log(`[Job ${job.id}] Executing AI generation for ${taskType}...`);

    let result = '';

    try {
        const contextStr = context ? `\nAdditional context: ${JSON.stringify(context)}` : '';

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${systemPrompt}\n\nUser request: ${prompt}${contextStr}`
                        }]
                    }],
                    generationConfig: {
                        temperature: taskType === 'code_generation' ? 0.2 : 0.7,
                        maxOutputTokens: 8192,
                    }
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`AI API returned ${response.status}: ${errText}`);
        }

        const data = await response.json();
        result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!result) {
            throw new Error('AI returned empty response');
        }
    } catch (err: any) {
        console.error(`[Job ${job.id}] AI generation failed:`, err.message);
        throw new Error(`Long task AI generation failed: ${err.message}`);
    }

    // Step 4: Store the result
    await job.updateProgress(90);
    console.log(`[Job ${job.id}] Storing result (${result.length} chars)...`);

    try {
        const mongoose = (await import('mongoose')).default;
        const MONGODB_URI = process.env.MONGODB_URI;

        if (MONGODB_URI && mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGODB_URI);
        }

        // Create/use a TaskResult collection
        const TaskResultSchema = new mongoose.Schema({
            userId: { type: String, required: true, index: true },
            jobId: { type: String, required: true },
            taskType: { type: String, required: true },
            prompt: { type: String, required: true },
            result: { type: String, required: true },
            status: { type: String, default: 'completed' },
        }, { timestamps: true });

        const TaskResult = mongoose.models.TaskResult || mongoose.model('TaskResult', TaskResultSchema);

        await TaskResult.create({
            userId,
            jobId: job.id,
            taskType,
            prompt,
            result,
            status: 'completed',
        });
    } catch (dbErr: any) {
        console.warn(`[Job ${job.id}] Could not persist task result to DB:`, dbErr.message);
        // Non-fatal
    }

    await job.updateProgress(100);
    return {
        success: true,
        taskType,
        resultLength: result.length,
        result: result.substring(0, 500) + (result.length > 500 ? '...' : ''), // Preview in job result
        fullResult: result,
        message: `Long task "${taskType}" completed successfully (${result.length} chars generated).`,
    };
}
