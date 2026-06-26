import mongoose, { Schema, Document } from "mongoose";
import { AlertType, AlertPriority, PlanType } from "@/types";

export interface IAlert extends Document {
  title: string;
  message: string;
  type: AlertType;
  priority: AlertPriority;
  isActive: boolean;
  dismissible: boolean;
  targetPlans: PlanType[]; // If empty, targets all plans
  startsAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionText?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IModelConfig extends Document {
  modelId: string; // e.g. 'google/gemini-2.5-pro'
  provider: "openrouter" | "gemini";
  name: string;
  description: string;
  isActive: boolean;
  isPremium: boolean;
  contextWindow: number;
  visionSupport: boolean;
  toolSupport: boolean;
  systemPrompt?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ["emergency", "warning", "info", "maintenance", "announcement"],
      required: true 
    },
    priority: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "medium"
    },
    isActive: { type: Boolean, default: true },
    dismissible: { type: Boolean, default: true },
    targetPlans: [{ type: String, enum: ["free", "pro", "ultimate"] }],
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    actionUrl: { type: String },
    actionText: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const ModelConfigSchema = new Schema<IModelConfig>(
  {
    modelId: { type: String, required: true, unique: true },
    provider: { type: String, enum: ["openrouter", "gemini"], required: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    isPremium: { type: Boolean, default: false },
    contextWindow: { type: Number, default: 8192 },
    visionSupport: { type: Boolean, default: false },
    toolSupport: { type: Boolean, default: false },
    systemPrompt: { type: String },
  },
  { timestamps: true }
);

export interface ISponsorHighlight extends Document {
  title: string;
  description: string;
  linkText?: string;
  linkUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SponsorHighlightSchema = new Schema<ISponsorHighlight>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    linkText: { type: String },
    linkUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Alert = mongoose.models.Alert || mongoose.model<IAlert>("Alert", AlertSchema);
export const ModelConfig = mongoose.models.ModelConfig || mongoose.model<IModelConfig>("ModelConfig", ModelConfigSchema);
export const SponsorHighlight = mongoose.models.SponsorHighlight || mongoose.model<ISponsorHighlight>("SponsorHighlight", SponsorHighlightSchema);
