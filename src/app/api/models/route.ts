import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { ModelConfig } from "@/lib/db/models/Admin";
import { DEFAULT_MODEL_CONFIGS } from "@/lib/ai/models";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    
    // Fetch all active models
    const activeModels = await ModelConfig.find({ isActive: true }).sort({ isPremium: 1, name: 1 });
    
    return NextResponse.json(activeModels.length > 0 ? activeModels : DEFAULT_MODEL_CONFIGS);
  } catch (error: any) {
    console.error("Models GET Error:", error);
    return NextResponse.json(DEFAULT_MODEL_CONFIGS);
  }
}
