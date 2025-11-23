import type { Request } from "express";

export type Role =
  | "SuperAdmin"
  | "TenantAdmin"
  | "TenantUser"
  | "ShopOwner"
  | "BranchManager"
  | "Supervisor"
  | "Cashier";

export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "grace_period";

export type SubscriptionPlan = "Free" | "Pro" | "Enterprise";

export interface AuthUser {
  userId: string;
  role: Role;
  tenantId?: string;
  branchId?: string; // Primary branch assignment
}

export interface TenantContext {
  tenantId: string;
  isActive: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan;
  maxUsers: number;
}

export interface BranchContext {
  branchId: string;
  branchCode: string;
  branchName: string;
  isActive: boolean;
  managerId: string | null;
}

export interface OpeningHours {
  monday?: { open: string; close: string } | { closed: true };
  tuesday?: { open: string; close: string } | { closed: true };
  wednesday?: { open: string; close: string } | { closed: true };
  thursday?: { open: string; close: string } | { closed: true };
  friday?: { open: string; close: string } | { closed: true };
  saturday?: { open: string; close: string } | { closed: true };
  sunday?: { open: string; close: string } | { closed: true };
}

export interface EffectiveBranchSettings {
  // Tax & Legal
  vatNumber: string | null;
  tinNumber: string | null;
  businessRegistrationNumber: string | null;
  taxRate: number;

  // Address
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateProvince: string | null;
  postalCode: string;
  country: string;

  // Contact
  phoneNumber: string;
  alternativePhone: string | null;
  email: string;
  faxNumber: string | null;

  // Settings
  currency: string;
  timezone: string | null;

  // Branding
  receiptHeader: string | null;
  receiptFooter: string | null;
  logoUrl: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  tenant?: TenantContext;
  branch?: BranchContext;
}
