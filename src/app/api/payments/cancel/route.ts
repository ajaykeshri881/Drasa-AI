import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { cancelSubscription } from "@/lib/payments/razorpay";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const dbUser = await User.findOne({ email: session.user.email });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subscriptionId = dbUser.razorpaySubscriptionId;

    if (subscriptionId) {
      // Call Razorpay API to cancel the subscription
      try {
        await cancelSubscription(subscriptionId);
      } catch (e) {
        console.error("Razorpay API cancel failed, proceeding with local downgrade:", e);
      }
    }

    // Update the user's plan to 'free' and remove the subscription ID
    await User.findOneAndUpdate(
      { email: session.user.email },
      { 
        $set: { plan: "free" },
        $unset: { razorpaySubscriptionId: "", planExpiryDate: "" }
      }
    );

    return NextResponse.json({ success: true, message: "Subscription cancelled successfully." });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json({ error: error.message || "Failed to cancel subscription" }, { status: 500 });
  }
}
