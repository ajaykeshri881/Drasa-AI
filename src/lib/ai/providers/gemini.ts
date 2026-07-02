import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const getGeminiModel = (modelId: string) => {
  const googleAI = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
  
  const formattedId = modelId.startsWith("models/") ? modelId : `models/${modelId}`;
  return googleAI(formattedId);
};
