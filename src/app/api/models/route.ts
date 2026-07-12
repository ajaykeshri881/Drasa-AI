import { NextResponse } from "next/server";
import { getActiveModelConfigs } from "@/lib/ai/config";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activeModels = await getActiveModelConfigs();
    const allModels = [...activeModels];
    
    // Auto-fetch local Ollama models
    try {
      const ollamaRes = await fetch("http://127.0.0.1:11434/api/tags", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(2000), 
      });
      if (ollamaRes.ok) {
        const ollamaData = await ollamaRes.json();
        if (ollamaData.models && Array.isArray(ollamaData.models)) {
          const localModels = ollamaData.models.map((m: any) => ({
            modelId: `ollama/${m.name}`,
            name: `${m.name}`,
            provider: "ollama",
            isPremium: false,
            visionSupport: false,
            contextWindow: 8192,
          }));
          allModels.push(...localModels);
        }
      }
    } catch (ollamaErr) {
      // Gracefully ignore if Ollama is not running
      console.warn("Could not fetch local Ollama models. Ensure Ollama is running.", ollamaErr);
    }
    
    return NextResponse.json(allModels);
  } catch (error: any) {
    console.error("Models GET Error:", error);
    const { DEFAULT_MODEL_CONFIGS } = await import("@/lib/ai/gemini-config/models");
    return NextResponse.json(DEFAULT_MODEL_CONFIGS);
  }
}
