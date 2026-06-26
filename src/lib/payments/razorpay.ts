import Razorpay from "razorpay";
import crypto from "crypto";

export const PLAN_PRICING = {
  free: { amount: 0, currency: "INR" },

  pro: { amount: 39900, currency: "INR" }, // amount in paise (399.00 INR)
  ultimate: { amount: 99900, currency: "INR" }, // amount in paise (999.00 INR)
};

export type PaidPlanId = Exclude<keyof typeof PLAN_PRICING, "free">;

export function isPaidPlanId(planId: unknown): planId is PaidPlanId {
  return planId === "pro" || planId === "ultimate";
}

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function createOrder(planId: PaidPlanId) {
  const plan = PLAN_PRICING[planId];
  if (!plan || plan.amount === 0) {
    throw new Error("Invalid plan or plan does not require payment.");
  }

  const razorpayClient = getRazorpayClient();

  const options = {
    amount: plan.amount,
    currency: plan.currency,
    receipt: `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  };

  try {
    const order = await razorpayClient.orders.create(options);
    return order;
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    throw new Error("Could not create Razorpay order.");
  }
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured.");
  }
  
  const body = orderId + "|" + paymentId;
  
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body.toString())
    .digest("hex");

  return expectedSignature === signature;
}

/**
 * Verify Razorpay webhook signature for async event handling.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  webhookSecret?: string
): boolean {
  const secret = webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error("No webhook secret configured.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}

/**
 * Fetch payment details from Razorpay for admin lookups.
 */
export async function getPaymentDetails(paymentId: string) {
  const razorpayClient = getRazorpayClient();
  try {
    const payment = await razorpayClient.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error("Failed to fetch payment details:", error);
    throw new Error("Could not fetch payment details from Razorpay.");
  }
}

/**
 * Get the Razorpay Plan ID for a given paid plan.
 * First checks environment variables. If missing, it dynamically fetches or creates
 * the plan via the Razorpay API to provide a seamless developer experience.
 */
async function getRazorpayPlanId(planId: PaidPlanId): Promise<string> {
  const envPlanId = process.env[`RAZORPAY_PLAN_ID_${planId.toUpperCase()}`];
  if (envPlanId) return envPlanId;

  const razorpayClient = getRazorpayClient();
  const planDetails = PLAN_PRICING[planId];
  const planName = `Drasa AI - ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`;

  try {
    // 1. Try to find an existing plan with the same amount and name
    const { items: plans } = await razorpayClient.plans.all();
    const existingPlan = plans.find((p: any) => 
      p.item.amount === planDetails.amount && 
      p.item.name === planName
    );

    if (existingPlan) {
      return existingPlan.id;
    }

    // 2. If no plan exists, dynamically create one
    console.log(`Dynamically creating Razorpay Plan for: ${planName}`);
    const newPlan = await razorpayClient.plans.create({
      period: "monthly",
      interval: 1,
      item: {
        name: planName,
        amount: planDetails.amount,
        currency: planDetails.currency,
        description: `Monthly subscription for ${planName}`
      }
    });

    return newPlan.id;
  } catch (error) {
    console.error("Failed to fetch or create Razorpay Plan dynamically:", error);
    throw new Error(`Auto-pay configuration failed. Could not dynamically create Razorpay Plan for ${planId}.`);
  }
}

/**
 * Create a Razorpay Subscription for recurring auto-pay.
 */
export async function createSubscription(planId: PaidPlanId) {
  const razorpayClient = getRazorpayClient();
  const rpPlanId = await getRazorpayPlanId(planId);

  try {
    const subscription = await razorpayClient.subscriptions.create({
      plan_id: rpPlanId,
      total_count: 120, // 10 years by default
      customer_notify: 0,
    });
    return subscription;
  } catch (error) {
    console.error("Razorpay subscription creation failed:", error);
    throw new Error("Could not create Razorpay subscription.");
  }
}

/**
 * Verify Razorpay Subscription signature.
 * Unlike orders, subscriptions sign "payment_id|subscription_id".
 */
export function verifySubscriptionSignature(
  subscriptionId: string,
  paymentId: string,
  signature: string
) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured.");
  }
  
  const body = paymentId + "|" + subscriptionId;
  
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body.toString())
    .digest("hex");

  return expectedSignature === signature;
}

/**
 * Cancel a Razorpay Subscription immediately.
 */
export async function cancelSubscription(subscriptionId: string) {
  const razorpayClient = getRazorpayClient();
  try {
    const subscription = await razorpayClient.subscriptions.cancel(subscriptionId, false);
    return subscription;
  } catch (error) {
    console.error("Failed to cancel Razorpay Subscription:", error);
    throw new Error("Could not cancel Razorpay subscription.");
  }
}
