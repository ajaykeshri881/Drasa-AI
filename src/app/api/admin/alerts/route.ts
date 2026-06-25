import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import { Alert } from "@/lib/db/models/Admin";
import { User } from "@/lib/db/models/User";

export async function GET() {
  try {
    const session = await auth();
    
    // Require admin authentication
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const alerts = await Alert.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json(alerts);

  } catch (error: any) {
    console.error("Admin Alerts GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    // Require admin authentication
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { severity, message, targetPlans } = body;

    if (!severity || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the admin user to get their ObjectId
    const adminUser = await User.findOne({ email: session.user.email });
    
    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found in DB" }, { status: 404 });
    }

    // Map severity to schema fields
    const typeMap: Record<string, string> = {
      info: "info",
      warning: "warning",
      critical: "emergency",
      emergency: "emergency",
      maintenance: "maintenance",
    };
    
    const priorityMap: Record<string, string> = {
      info: "low",
      warning: "medium",
      critical: "critical",
      emergency: "critical",
      maintenance: "high",
    };

    const newAlert = await Alert.create({
      title: severity.toUpperCase() + " ALERT",
      message,
      type: typeMap[severity] || "info",
      priority: priorityMap[severity] || "low",
      targetPlans: targetPlans || [],
      createdBy: adminUser._id
    });

    return NextResponse.json({ success: true, alert: newAlert });

  } catch (error: any) {
    console.error("Admin Alerts POST Error:", error);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Alert ID is required" }, { status: 400 });
    }

    await connectDB();
    await Alert.findByIdAndUpdate(id, { isActive: false });

    return NextResponse.json({ success: true, message: "Alert deactivated" });
  } catch (error: any) {
    console.error("Admin Alerts DELETE Error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate alert" },
      { status: 500 }
    );
  }
}
