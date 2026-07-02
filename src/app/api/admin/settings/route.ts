import { NextResponse } from "next/server";
import { auth } from "@/features/auth/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { SystemConfig } from "@/lib/db/models/Admin";
import { invalidateConfigCache } from "@/lib/ai/config";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({});
    }

    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Admin Settings GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    await connectDB();
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({});
    }

    // Update fields
    if (body.defaultFallbackModelId !== undefined) config.defaultFallbackModelId = body.defaultFallbackModelId;
    if (body.defaultVisionModelId !== undefined) config.defaultVisionModelId = body.defaultVisionModelId;
    if (body.systemPromptBase !== undefined) config.systemPromptBase = body.systemPromptBase;

    await config.save();

    // Invalidate the cache so the next request gets the new settings
    await invalidateConfigCache();

    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Admin Settings PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
