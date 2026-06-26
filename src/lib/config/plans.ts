export const SUBSCRIPTION_PLANS = {
  free: {
    monthlyTokens: 25000,
    monthlyWebsites: 4,
    name: "Free",
  },
  pro: {
    monthlyTokens: 750000,
    monthlyWebsites: 20,
    name: "Pro",
  },
  ultimate: {
    monthlyTokens: 2000000,
    monthlyWebsites: 100,
    name: "Ultimate",
  },
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;

export const isValidPlan = (plan: string): plan is PlanId => {
  return plan in SUBSCRIPTION_PLANS;
};

export const getPlanLimits = (plan: string) => {
  if (isValidPlan(plan)) {
    return SUBSCRIPTION_PLANS[plan];
  }
  return SUBSCRIPTION_PLANS.free; // Default fallback
};
