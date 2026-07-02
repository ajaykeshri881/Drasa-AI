import mongoose, { Schema, Document } from "mongoose";
import { PlanType, RoleType, UserPreferences, UserUsage } from "@/types";

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  role: RoleType;
  plan: PlanType;
  isGuest: boolean;
  preferences: UserPreferences;
  usage: UserUsage;
  customInstructions?: string; // Additional context user provides
  locale?: string;
  timezone?: string;
  planExpiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    plan: { type: String, enum: ["free", "pro", "ultimate"], default: "free" },
    isGuest: { type: Boolean, default: false },
    preferences: {
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      language: { type: String, default: "en" },
      thinkingMode: { type: Boolean, default: false },
      temporaryChat: { type: Boolean, default: false },
      ttsEnabled: { type: Boolean, default: false },
      defaultModel: { type: String, default: "meta-llama/llama-3.3-70b-instruct:free" },
      showSponsorHighlights: { type: Boolean, default: false },
    },
    usage: {
      messagesUsedToday: { type: Number, default: 0 },
      tokensUsedToday: { type: Number, default: 0 },
      messagesUsedThisMonth: { type: Number, default: 0 },
      tokensUsedThisMonth: { type: Number, default: 0 },
      filesUsedToday: { type: Number, default: 0 },
      imagesUsedToday: { type: Number, default: 0 },
      toolsUsedToday: { type: Number, default: 0 },
      websiteGenerationsUsed: { type: Number, default: 0 },
      bytesUploadedToday: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now },
      lastMonthlyResetDate: { type: Date, default: Date.now },
    },
    customInstructions: { type: String },
    locale: { type: String },
    timezone: { type: String },
    planExpiryDate: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
