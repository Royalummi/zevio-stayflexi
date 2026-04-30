import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    // Try to get token from Zustand store first
    let token = null;
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        token = parsed.state?.accessToken;
      } catch (e) {
        console.error("Error parsing auth storage:", e);
      }
    }

    // Fallback to direct localStorage
    if (!token) {
      token = localStorage.getItem("accessToken");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Concurrent refresh queuing: only one refresh request at a time
let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (newAccessToken) => {
  refreshSubscribers.forEach((cb) => cb(newAccessToken));
  refreshSubscribers = [];
};

const onRefreshFailed = (error) => {
  refreshSubscribers.forEach((cb) => cb(null, error));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((newToken, err) => {
            if (err) return reject(err);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        // Get refresh token from Zustand store
        let refreshToken = null;
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage);
            refreshToken = parsed.state?.refreshToken;
          } catch (e) {
            console.error("Error parsing auth storage:", e);
          }
        }

        // Fallback to direct localStorage
        if (!refreshToken) {
          refreshToken = localStorage.getItem("refreshToken");
        }

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        // Update both localStorage and Zustand storage
        localStorage.setItem("accessToken", accessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // Update Zustand store
        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage);
            parsed.state.accessToken = accessToken;
            if (newRefreshToken) {
              parsed.state.refreshToken = newRefreshToken;
            }
            localStorage.setItem("auth-storage", JSON.stringify(parsed));
          } catch (e) {
            console.error("Error updating auth storage:", e);
          }
        }

        isRefreshing = false;
        onRefreshed(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshFailed(refreshError);

        // Clear all auth data
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("auth-storage");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Note: 403 Forbidden is NOT handled globally here.
    // Each component / call-site is responsible for handling 403 appropriately.
    // Auto-logout on 403 was removed because some components use 403 as a signal
    // to fall back to a different endpoint (e.g. CityCombobox: admin → vendor → public).
    // Blindly logging the user out on every 403 broke those fallback flows and
    // caused vendors / admins to be ejected from the dashboard unexpectedly.

    return Promise.reject(error);
  },
);

export default api;
export { api };
