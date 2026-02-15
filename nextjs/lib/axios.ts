import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4500/api";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token refresh state management
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Skip refresh for login and register endpoints
      if (
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/register") ||
        originalRequest.url?.includes("/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      // Prevent infinite loops
      if (originalRequest._retry) {
        // Clear auth data and redirect to home
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
        isRefreshing = false;
        refreshPromise = null;

        if (typeof window !== "undefined") {
          // Redirect to home page instead of /login (which doesn't exist)
          if (window.location.pathname !== "/") {
            window.location.href = "/";
          }
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // If already refreshing, wait for that promise
        if (isRefreshing && refreshPromise) {
          const newAccessToken = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }

        // Start refresh process
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Set refreshing state and create promise
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            // Use axios directly without interceptor to avoid infinite loop
            const response = await axios.post(
              `${baseURL}/auth/refresh`,
              { refreshToken },
              { headers: { "Content-Type": "application/json" } },
            );

            const { accessToken } = response.data.data;

            // Update token in localStorage
            localStorage.setItem("token", accessToken);

            // Update the authorization header
            api.defaults.headers.common["Authorization"] =
              `Bearer ${accessToken}`;

            return accessToken;
          } finally {
            // Reset state after refresh completes (success or failure)
            isRefreshing = false;
            refreshPromise = null;
          }
        })();

        const newAccessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
        isRefreshing = false;
        refreshPromise = null;

        if (typeof window !== "undefined") {
          // Only redirect if not already on home page
          if (window.location.pathname !== "/") {
            window.location.href = "/";
          }
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 404 errors gracefully
    if (error.response?.status === 404) {
      console.error("Resource not found:", error.config?.url);
    }

    return Promise.reject(error);
  },
);
