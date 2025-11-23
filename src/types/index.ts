import { Request } from 'express';

export type Role = 'SuperAdmin' | 'TenantAdmin' | 'TenantUser';

export type SubscriptionStatus = 'active' | 'inactive' | 'suspended' | 'grace_period';

export type SubscriptionPlan = 'Free' | 'Pro' | 'Enterprise';

export interface AuthUser {
  userId: string;
  role: Role;
  tenantId?: string;
}

export interface TenantContext {
  tenantId: string;
  isActive: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan;
  maxUsers: number;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  tenant?: TenantContext;
}
