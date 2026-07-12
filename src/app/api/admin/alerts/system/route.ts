import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Alert } from "@/lib/db/models/Admin";
import { auth } from "@/features/auth/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, message, type, priority } = body;

    await connectDB();

    // Prevent duplicate spam if an identical active alert exists within the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let existingAlert = null;
    try {
      existingAlert = await Alert.findOne({
        title,
        type,
        isActive: true,
        createdAt: { $gte: oneHourAgo }
      });
    } catch (e) {
      console.error(e);
    }

    if (existingAlert) {
      return NextResponse.json({ success: true, message: "Duplicate alert suppressed", alert: existingAlert });
    }

    const newAlert = await Alert.create({
      title,
      message,
      type: type || "emergency",
      priority: priority || "critical",
      isActive: true,
      dismissible: true,
      targetPlans: [],
    });

    return NextResponse.json({ success: true, alert: newAlert });
  } catch (error: any) {
    console.error("Failed to create system alert:", error);
    return NextResponse.json(
      { error: "Failed to create system alert", details: error.message },
      { status: 500 }
    );
  }
}
