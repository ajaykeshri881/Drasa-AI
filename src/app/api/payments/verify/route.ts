import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/features/auth/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { isPaidPlanId, verifyPaymentSignature, verifySubscriptionSignature } from "@/features/payments/lib/razorpay";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_subscription_id, razorpay_payment_id, razorpay_signature, planId } = body;

    if (!isPaidPlanId(planId)) {
      return NextResponse.json({ error: "Invalid paid plan" }, { status: 400 });
    }

    let isValid = false;

    // Verify signature based on whether it is a subscription or order
    try {
      if (razorpay_subscription_id) {
        isValid = verifySubscriptionSignature(razorpay_subscription_id, razorpay_payment_id, razorpay_signature);
      } else if (razorpay_order_id) {
        isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      } else {
        return NextResponse.json({ error: "Missing order or subscription ID" }, { status: 400 });
      }
    } catch (sigError: any) {
      return NextResponse.json({ error: sigError.message || "Signature verification error" }, { status: 400 });
    }

    if (!isValid) {
      return NextResponse.json({ error: "Payment verification failed. Invalid signature." }, { status: 400 });
    }

    let planExpiryDate = new Date();
    planExpiryDate.setDate(planExpiryDate.getDate() + 30);

    if (razorpay_subscription_id) {
      try {
        const { getRazorpayClient } = await import("@/features/payments/lib/razorpay");
        const client = getRazorpayClient();
        const sub = await client.subscriptions.fetch(razorpay_subscription_id);
        if (sub && sub.current_end) {
          planExpiryDate = new Date(sub.current_end * 1000);
        }
      } catch (e) {
        console.error("Failed to fetch exact subscription expiry:", e);
      }
    }

    // Payment is verified! Update the user's plan in DB
    const updateData: any = {
      $set: { 
        plan: planId, 
        planExpiryDate,
        "usage.tokensUsedToday": 0,
        "usage.messagesUsedToday": 0,
        "usage.tokensUsedThisMonth": 0,
        "usage.messagesUsedThisMonth": 0,
        "usage.lastResetDate": new Date(),
        "usage.lastMonthlyResetDate": new Date()
      }
    };
    if (razorpay_subscription_id) {
      updateData.$set.razorpaySubscriptionId = razorpay_subscription_id;
    }

    await connectDB();
    await User.findOneAndUpdate(
      { email: session.user.email },
      updateData
    );

    return NextResponse.json({ success: true, message: "Payment verified and plan upgraded." });
  } catch (error: any) {
    console.error("Razorpay verify error:", error);
    return NextResponse.json({ error: error.message || "Failed to verify payment" }, { status: 500 });
  }
}
