import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { verifyWebhookSignature } from "@/features/payments/lib/razorpay";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    await connectDB();

    switch (event.event) {
      case "subscription.charged": {
        const subscription = event.payload.subscription.entity;
        
        // Let's assume the user was saved with this subscription ID in verify/route.ts
        const user = await User.findOne({ razorpaySubscriptionId: subscription.id });
        if (user) {
          // current_end is a Unix timestamp in seconds
          const newExpiry = new Date(subscription.current_end * 1000);
          
          await User.updateOne(
            { _id: user._id },
            { 
              $set: { 
                planExpiryDate: newExpiry,
                // Reset monthly usage on charge
                "usage.tokensUsedThisMonth": 0,
                "usage.messagesUsedThisMonth": 0,
                "usage.lastMonthlyResetDate": new Date()
              } 
            }
          );
        }
        break;
      }
      
      case "subscription.halted":
      case "subscription.cancelled": {
        const subscription = event.payload.subscription.entity;
        
        await User.updateOne(
          { razorpaySubscriptionId: subscription.id },
          { 
            $set: { 
              plan: "free",
              planExpiryDate: new Date()
            } 
          }
        );
        break;
      }

      default:
        console.log("Unhandled Razorpay event:", event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
