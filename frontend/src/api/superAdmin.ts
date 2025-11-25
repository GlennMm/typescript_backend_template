import { apiClient } from "./client";
import type { ApiResponse } from "./types";

export interface SuperAdminUser {
  id: string;
  email: string;
  name: string;
  role: "SuperAdmin";
}

export interface SuperAdminLoginResponse {
  success: boolean;
  data: {
    user: SuperAdminUser;
    accessToken: string;
    refreshToken: string;
  };
}

export interface TenantListItem {
  id: string;
  name: string;
  slug: string;
  subscriptionStatus: "active" | "inactive" | "suspended" | "grace_period";
  subscriptionStartDate: Date;
  subscriptionEndDate: Date | null;
  isActive: boolean;
  planName: string;
  createdAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  maxUsers: number;
  features: string[];
  createdAt: Date;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  subscriptionPlanId: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}

export interface TenantDetail extends TenantListItem {
  id: string;
  dbPath: string;
  subscriptionPlanId: string;
  planName: string;
}

export const superAdminApi = {
  login: async (
    email: string,
    password: string,
  ): Promise<SuperAdminLoginResponse> => {
    const response = await apiClient.post<SuperAdminLoginResponse>(
      "/auth/admin/login",
      { email, password },
    );
    return response.data;
  },

  getAllTenants: async (): Promise<ApiResponse<TenantListItem[]>> => {
    const response = await apiClient.get("/tenants");
    return response.data;
  },

  getTenantById: async (id: string): Promise<ApiResponse<TenantDetail>> => {
    const response = await apiClient.get(`/tenants/${id}`);
    return response.data;
  },

  createTenant: async (data: CreateTenantDto): Promise<ApiResponse<TenantDetail>> => {
    const response = await apiClient.post("/tenants", data);
    return response.data;
  },

  updateTenant: async (
    id: string,
    data: { name?: string; isActive?: boolean },
  ): Promise<ApiResponse<TenantDetail>> => {
    const response = await apiClient.put(`/tenants/${id}`, data);
    return response.data;
  },

  suspendTenant: async (id: string): Promise<ApiResponse<TenantDetail>> => {
    const response = await apiClient.patch(`/tenants/${id}/suspend`);
    return response.data;
  },

  activateTenant: async (id: string): Promise<ApiResponse<TenantDetail>> => {
    const response = await apiClient.patch(`/tenants/${id}/activate`);
    return response.data;
  },

  deleteTenant: async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const response = await apiClient.delete(`/tenants/${id}`);
    return response.data;
  },

  getSubscriptionPlans: async (): Promise<ApiResponse<SubscriptionPlan[]>> => {
    const response = await apiClient.get("/tenants/plans");
    return response.data;
  },

  updateSubscription: async (
    tenantId: string,
    data: {
      subscriptionPlanId?: string;
      subscriptionStatus?: "active" | "inactive" | "suspended" | "grace_period";
      subscriptionEndDate?: string;
    },
  ): Promise<ApiResponse<TenantDetail>> => {
    const response = await apiClient.patch(
      `/tenants/${tenantId}/subscription`,
      data,
    );
    return response.data;
  },
};
