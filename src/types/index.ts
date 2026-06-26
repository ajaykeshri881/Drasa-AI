// Global Types for Drasa AI

export type PlanType = "free" | "pro" | "ultimate";
export type RoleType = "user" | "admin";

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  thinkingMode: boolean;
  temporaryChat: boolean;
  ttsEnabled: boolean;
  defaultModel: string;
  showSponsorHighlights?: boolean;
}

export interface UserUsage {
  messagesUsedToday: number;
  tokensUsedToday: number;
  tokensUsedThisMonth: number;
  messagesUsedThisMonth: number;
  filesUsedToday: number;
  imagesUsedToday: number;
  toolsUsedToday: number;
  websiteGenerationsUsed: number;
  lastResetDate: Date;
  lastMonthlyResetDate: Date;
}

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: RoleType;
  plan: PlanType;
  preferences: UserPreferences;
  usage: UserUsage;
  isGuest: boolean;
}

export type AlertType = "emergency" | "warning" | "info" | "maintenance" | "announcement";
export type AlertPriority = "critical" | "high" | "medium" | "low";

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: AlertType;
  priority: AlertPriority;
  isActive: boolean;
  dismissible: boolean;
  startsAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionText?: string;
}
