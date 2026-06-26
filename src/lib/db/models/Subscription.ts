import mongoose, { Schema, Document } from "mongoose";
import { PlanType } from "@/types";

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  plan: PlanType;
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  status: "active" | "cancelled" | "past_due" | "incomplete";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  razorpayPaymentId: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: "success" | "failed" | "pending" | "refunded";
  plan: PlanType;
  createdAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: String, enum: ["free", "pro", "ultimate"], required: true },
    razorpaySubscriptionId: { type: String },
    razorpayCustomerId: { type: String },
    status: { 
      type: String, 
      enum: ["active", "cancelled", "past_due", "incomplete"],
      default: "active"
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    razorpayPaymentId: { type: String, required: true, unique: true },
    razorpayOrderId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { 
      type: String, 
      enum: ["success", "failed", "pending", "refunded"],
      required: true 
    },
    plan: { type: String, enum: ["free", "pro", "ultimate"], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
export const Payment = mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
