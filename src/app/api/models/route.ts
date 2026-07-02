import { NextResponse } from "next/server";
import { getActiveModelConfigs } from "@/lib/ai/config";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activeModels = await getActiveModelConfigs();
    return NextResponse.json(activeModels);
  } catch (error: any) {
    console.error("Models GET Error:", error);
    const { DEFAULT_MODEL_CONFIGS } = await import("@/lib/ai/models");
    return NextResponse.json(DEFAULT_MODEL_CONFIGS);
  }
}
