import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  subscriptionPlanId: z.string().min(1, 'Subscription plan is required'),
  adminEmail: z.string().email('Invalid email address'),
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  isActive: z.boolean().optional(),
});

export const updateSubscriptionSchema = z.object({
  subscriptionPlanId: z.string().min(1, 'Subscription plan is required').optional(),
  subscriptionStatus: z.enum(['active', 'inactive', 'suspended', 'grace_period']).optional(),
  subscriptionEndDate: z.string().datetime().optional(),
});

export type CreateTenantDto = z.infer<typeof createTenantSchema>;
export type UpdateTenantDto = z.infer<typeof updateTenantSchema>;
export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;
