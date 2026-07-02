import { NextResponse } from "next/server";
import { auth } from "@/features/auth/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { ModelConfig } from "@/lib/db/models/Admin";
import { AdminModelSchema, AdminModelUpdateSchema } from "@/lib/validations/api";

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
    const parsedData = AdminModelSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: parsedData.error.errors[0].message }, { status: 400 });
    }

    const { modelId, provider, name, description, isPremium, contextWindow, visionSupport, toolSupport } = parsedData.data;

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
    const parsedData = AdminModelUpdateSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: parsedData.error.errors[0].message }, { status: 400 });
    }

    const { modelId, ...updates } = parsedData.data;

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
