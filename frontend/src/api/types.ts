export interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  subscriptionStatus: "active" | "past_due" | "canceled" | "trialing";
  subscriptionExpiresAt: string | null;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    tenant: Tenant;
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterTenantRequest {
  name: string;
  email: string;
  password: string;
  tenantName: string;
  tenantSlug: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    code: string;
  };
}
