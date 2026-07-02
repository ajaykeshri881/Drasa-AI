import { z } from "zod";

export const AdminModelSchema = z.object({
  modelId: z.string().min(1, "modelId is required"),
  provider: z.string().min(1, "provider is required"),
  name: z.string().min(1, "name is required"),
  description: z.string().optional(),
  isPremium: z.boolean().optional().default(false),
  contextWindow: z.number().optional().default(4096),
  visionSupport: z.boolean().optional().default(false),
  toolSupport: z.boolean().optional().default(false),
});

export const AdminModelUpdateSchema = AdminModelSchema.partial().extend({
  modelId: z.string().min(1, "modelId is required"),
});

export const AdminUserUpdateSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  plan: z.enum(["free", "pro", "ultimate"]).optional(),
  role: z.enum(["user", "admin"]).optional(),
}).refine(data => data.plan || data.role, {
  message: "At least one field (plan or role) must be provided for update",
});

export const CreateOrderSchema = z.object({
  planId: z.string().min(1, "planId is required"),
  autoPay: z.boolean().optional().default(false),
});
