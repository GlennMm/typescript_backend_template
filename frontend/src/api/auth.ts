import { apiClient } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  RegisterTenantRequest,
  ApiResponse,
  User,
  Tenant,
} from "./types";

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      data,
    );
    return response.data;
  },

  register: async (
    data: RegisterTenantRequest,
  ): Promise<
    ApiResponse<{ user: User; tenant: Tenant; accessToken: string }>
  > => {
    const response = await apiClient.post("/tenants", data);
    return response.data;
  },

  refreshToken: async (
    refreshToken: string,
  ): Promise<ApiResponse<{ accessToken: string }>> => {
    const response = await apiClient.post("/auth/refresh", {
      refreshToken,
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get("/users/me");
    return response.data;
  },
};
