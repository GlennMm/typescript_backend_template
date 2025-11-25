import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Check if this is an admin route request
    const isAdminRequest = config.url?.includes("/admin") ||
                          config.url?.includes("/tenants");

    // Use appropriate token based on request type
    const token = isAdminRequest
      ? localStorage.getItem("superAdminAccessToken")
      : localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if we're on an admin page
      const isAdminPage = window.location.pathname.startsWith("/admin");

      if (isAdminPage) {
        // Clear super admin token and redirect to admin login
        localStorage.removeItem("superAdminAccessToken");
        localStorage.removeItem("superAdminRefreshToken");
        window.location.href = "/admin/login";
      } else {
        // Clear regular token and redirect to tenant login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
