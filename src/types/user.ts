import { PlanId } from "@/lib/config/plans";

export interface UserUsage {
  tokensUsedThisMonth: number;
  tokensUsedToday: number;
  messagesUsedThisMonth: number;
  messagesUsedToday: number;
  filesUsedToday: number;
  websiteGenerationsUsed: number;
  lastMonthlyResetDate: string;
  lastResetDate: string;
}

export interface UserPreferences {
  showSponsorHighlights: boolean;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  plan: PlanId;
  planExpiryDate?: string;
  usage: UserUsage;
  preferences: UserPreferences;
}
