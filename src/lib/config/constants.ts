export const PLAN_LIMITS = {
  free: { 
    name: 'free',
    monthlyTokens: 25_000, 
    dailyMessages: 20, 
    dailyFiles: 3,
    monthlyWebsites: 4,
    dailyUploadBytes: 20 * 1024 * 1024 // 20 MB
  },
  pro: { 
    name: 'pro',
    monthlyTokens: 750_000, 
    dailyMessages: 200, 
    dailyFiles: 20,
    monthlyWebsites: 20,
    dailyUploadBytes: 100 * 1024 * 1024 // 100 MB
  },
  ultimate: { 
    name: 'ultimate',
    monthlyTokens: 2_000_000, 
    dailyMessages: -1, // Unlimited
    dailyFiles: 100,
    monthlyWebsites: 100,
    dailyUploadBytes: 500 * 1024 * 1024 // 500 MB
  },
} as const;

export const PRICING = {
  pro: { amount: 399, currency: 'INR' },
  ultimate: { amount: 999, currency: 'INR' },
} as const;
