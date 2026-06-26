import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { Payment } from "@/lib/db/models/Subscription";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
    }

    let isValid = false;
    try {
      isValid = verifyWebhookSignature(rawBody, signature);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
    }

    if (!isValid) {
      console.warn("Invalid webhook signature received");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    console.log(`Razorpay Webhook Event Received: ${event.event}`);

    await connectDB();

    switch (event.event) {
      case "subscription.charged": {
        const subscriptionEntity = event.payload.subscription?.entity;
        const paymentEntity = event.payload.payment?.entity;

        if (!subscriptionEntity) {
          return NextResponse.json({ error: "Missing subscription entity" }, { status: 400 });
        }

        const subscriptionId = subscriptionEntity.id;
        
        // Find user by subscription ID
        const user = await User.findOne({ razorpaySubscriptionId: subscriptionId });
        if (!user) {
          console.warn(`User with subscriptionId ${subscriptionId} not found`);
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Extend plan expiry by 30 days
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              planExpiryDate: expiryDate,
              "usage.tokensUsedToday": 0,
              "usage.messagesUsedToday": 0,
              "usage.tokensUsedThisMonth": 0,
              "usage.messagesUsedThisMonth": 0,
              "usage.lastResetDate": new Date(),
              "usage.lastMonthlyResetDate": new Date(),
            }
          }
        );

        // Record the payment details in Payment history
        if (paymentEntity) {
          try {
            await Payment.create({
              userId: user._id,
              razorpayPaymentId: paymentEntity.id,
              razorpayOrderId: paymentEntity.order_id || undefined,
              amount: paymentEntity.amount, // in paise
              currency: paymentEntity.currency || "INR",
              status: "success",
              plan: user.plan,
            });
          } catch (paymentErr: any) {
            console.error("Failed to create Payment history row in webhook:", paymentErr.message);
          }
        }

        console.log(`Successfully processed renewal for user: ${user.email}`);
        break;
      }

      case "subscription.cancelled":
      case "subscription.halted": {
        const subscriptionEntity = event.payload.subscription?.entity;
        if (!subscriptionEntity) {
          return NextResponse.json({ error: "Missing subscription entity" }, { status: 400 });
        }

        const subscriptionId = subscriptionEntity.id;
        const user = await User.findOne({ razorpaySubscriptionId: subscriptionId });
        
        if (user) {
          await User.updateOne(
            { _id: user._id },
            {
              $set: { plan: "free" },
              $unset: { razorpaySubscriptionId: "", planExpiryDate: "" }
            }
          );
          console.log(`Downgraded user ${user.email} due to subscription cancellation`);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message || "Webhook processing failed" }, { status: 500 });
  }
}
