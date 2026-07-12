import { connectDB } from "@/lib/db/connection";
import { ModelConfig, SystemConfig, ISystemConfig, IModelConfig } from "@/lib/db/models/Admin";
import { DEFAULT_MODEL_CONFIGS, PublicModelConfig } from "./gemini-config/models";

// In-memory cache for fast lookups — each cache has its own TTL to avoid collision
let cachedSystemConfig: ISystemConfig | null = null;
let systemConfigCacheTime = 0;

let cachedModelConfigs: IModelConfig[] | null = null;
let modelConfigCacheTime = 0;

const CACHE_TTL = 60 * 1000; // 60 seconds

export async function getGlobalSystemConfig() {
  const now = Date.now();
  if (cachedSystemConfig && now - systemConfigCacheTime < CACHE_TTL) {
    return cachedSystemConfig;
  }

  await connectDB();
  let config = await SystemConfig.findOne();
  if (!config) {
    // Create default if it doesn't exist
    config = await SystemConfig.create({});
  }

  cachedSystemConfig = config;
  systemConfigCacheTime = now;
  return config;
}

export async function getActiveModelConfigs(): Promise<PublicModelConfig[]> {
  const now = Date.now();
  if (cachedModelConfigs && now - modelConfigCacheTime < CACHE_TTL) {
    return cachedModelConfigs as any;
  }

  await connectDB();
  const models = await ModelConfig.find({ isActive: true }).sort({ isPremium: 1, name: 1 });
  
  if (models.length > 0) {
    cachedModelConfigs = models;
    modelConfigCacheTime = now;
    return models as any;
  }

  // Fallback to defaults if DB is completely empty
  return DEFAULT_MODEL_CONFIGS;
}

export async function invalidateConfigCache() {
  cachedSystemConfig = null;
  cachedModelConfigs = null;
  systemConfigCacheTime = 0;
  modelConfigCacheTime = 0;
}
