import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createOrder, createSubscription, isPaidPlanId } from "@/lib/payments/razorpay";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, autoPay } = body;

    if (!isPaidPlanId(planId)) {
      return NextResponse.json({ error: "Invalid paid plan" }, { status: 400 });
    }

    if (autoPay) {
      const subscription = await createSubscription(planId);
      return NextResponse.json({
        isSubscription: true,
        id: subscription.id,
        // Subscriptions don't have an explicit 'amount' field in the same way, 
        // as amount is defined by the plan, but we can pass it if frontend needs it
        keyId: process.env.RAZORPAY_KEY_ID
      });
    } else {
      const order = await createOrder(planId);
      return NextResponse.json({
        isSubscription: false,
        id: order.id,
        currency: order.currency,
        amount: order.amount,
        keyId: process.env.RAZORPAY_KEY_ID
      });
    }
  } catch (error: any) {
    console.error("Razorpay create-order error:", error);
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}
