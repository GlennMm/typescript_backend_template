import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SuperAdminUser } from "@/api/superAdmin";

interface SuperAdminState {
  user: SuperAdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (data: {
    user: SuperAdminUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  clearAuth: () => void;
}

export const useSuperAdminStore = create<SuperAdminState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: ({ user, accessToken, refreshToken }) => {
        localStorage.setItem("superAdminAccessToken", accessToken);
        localStorage.setItem("superAdminRefreshToken", refreshToken);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },
      clearAuth: () => {
        localStorage.removeItem("superAdminAccessToken");
        localStorage.removeItem("superAdminRefreshToken");
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "super-admin-storage",
    },
  ),
);
