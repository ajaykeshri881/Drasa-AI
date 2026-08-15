import { NextResponse } from "next/server";
import { getActiveModelConfigs } from "@/lib/ai/config";
import { auth } from "@/features/auth/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activeModels = await getActiveModelConfigs();
    const allModels = [...activeModels];
    return NextResponse.json(allModels);
  } catch (error: any) {
    console.error("Models GET Error:", error);
    const { DEFAULT_MODEL_CONFIGS } = await import("@/lib/ai/gemini-config/models");
    return NextResponse.json(DEFAULT_MODEL_CONFIGS);
  }
}
