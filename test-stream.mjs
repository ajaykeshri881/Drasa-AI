import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

async function main() {
  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY
  });

  const model = openrouter('google/gemma-4-31b-it:free');

  try {
    const result = await streamText({
      model: model,
      messages: [{ role: 'user', content: 'hello' }],
    });

    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
