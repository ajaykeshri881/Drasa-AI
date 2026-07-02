import { PLAN_LIMITS } from './constants';

export const SUBSCRIPTION_PLANS = PLAN_LIMITS;

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
