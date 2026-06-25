import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import { ModelConfig } from "@/lib/db/models/Admin";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const models = await ModelConfig.find().sort({ isPremium: 1, name: 1 });
    return NextResponse.json(models);

  } catch (error: any) {
    console.error("Admin Models GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { modelId, provider, name, description, isPremium, contextWindow, visionSupport, toolSupport } = body;

    if (!modelId || !provider || !name) {
      return NextResponse.json({ error: "modelId, provider, and name are required" }, { status: 400 });
    }

    await connectDB();
    const model = await ModelConfig.create({
      modelId, provider, name, description, isPremium, contextWindow, visionSupport, toolSupport,
    });

    return NextResponse.json(model, { status: 201 });

  } catch (error: any) {
    console.error("Admin Models POST Error:", error);
    return NextResponse.json({ error: "Failed to create model config" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { modelId, ...updates } = body;

    if (!modelId) {
      return NextResponse.json({ error: "modelId is required" }, { status: 400 });
    }

    await connectDB();
    const updated = await ModelConfig.findOneAndUpdate(
      { modelId },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Model config not found" }, { status: 404 });
    }

    return NextResponse.json(updated);

  } catch (error: any) {
    console.error("Admin Models PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update model config" }, { status: 500 });
  }
}
