import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUser = user;

    // Check if subscription has expired
    if (user.plan !== "free" && user.planExpiryDate) {
      if (new Date() > new Date(user.planExpiryDate)) {
        // Downgrade to free
        await User.updateOne({ _id: user._id }, { $set: { plan: "free" } });
        currentUser.plan = "free";
      }
    }

    return NextResponse.json({
      user: {
        id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        plan: currentUser.plan,
        role: currentUser.role,
        usage: currentUser.usage,
        preferences: currentUser.preferences,
        planExpiryDate: currentUser.planExpiryDate,
        razorpaySubscriptionId: currentUser.razorpaySubscriptionId,
      }
    });
  } catch (error: any) {
    console.error("Failed to fetch user data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json({ error: "Preferences data is required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { "preferences.showSponsorHighlights": preferences.showSponsorHighlights } },
      { new: true }
    ).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, preferences: user.preferences });
  } catch (error: any) {
    console.error("Failed to update user data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
