import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const getGeminiModel = (modelId: string, keyIndex: number = 0) => {
  const envKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
  const keys = envKey.split(",").map(k => k.trim()).filter(Boolean);
  
  // Use the requested index, or wrap around if it exceeds the available keys
  const apiKey = keys.length > 0 ? keys[keyIndex % keys.length] : "";

  const googleAI = createGoogleGenerativeAI({
    apiKey,
  });
  
  const formattedId = modelId.startsWith("models/") ? modelId : `models/${modelId}`;
  return googleAI(formattedId);
};

