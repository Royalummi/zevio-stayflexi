"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/axios";

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  role?: "user" | "vendor" | "employee" | "admin";
  corporate_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithTokens: (
    accessToken: string,
    refreshToken: string | null,
    userData: User,
  ) => void;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Set authorization header on mount
  useEffect(() => {
    const initAuth = () => {
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const data = response.data.data;

      // Temporary-password flow: backend signals the user must change their password
      if (data.requirePasswordChange) {
        const err = new Error("PASSWORD_CHANGE_REQUIRED") as Error & {
          requirePasswordChange: true;
          tempToken: string;
          loginEmail: string;
          loginPassword: string;
        };
        err.requirePasswordChange = true;
        err.tempToken = data.tempToken;
        err.loginEmail = email;
        err.loginPassword = password;
        throw err;
      }

      const { accessToken, refreshToken, user: userData } = data;

      // Store token, refresh token, and user
      localStorage.setItem("token", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      localStorage.setItem("user", JSON.stringify(userData));

      setToken(accessToken);
      setUser(userData);

      // Set authorization header for future requests
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } catch (error: unknown) {
      // Re-throw our own typed signals (e.g. PASSWORD_CHANGE_REQUIRED) unchanged
      if (
        error instanceof Error &&
        error.message === "PASSWORD_CHANGE_REQUIRED"
      ) {
        throw error;
      }
      const err = error as {
        response?: {
          data?: {
            message?: string;
            corporate_unverified?: boolean;
            email?: string;
          };
        };
      };
      const errorMessage =
        err.response?.data?.message || "Login failed. Please try again.";
      const thrownError = new Error(errorMessage);
      // Attach full response data so callers can inspect it
      Object.assign(thrownError, { responseData: err.response?.data });
      throw thrownError;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post("/auth/register", data);

      const { accessToken, refreshToken, user: userData } = response.data.data;

      // Store token, refresh token, and user
      localStorage.setItem("token", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      localStorage.setItem("user", JSON.stringify(userData));

      setToken(accessToken);
      setUser(userData);

      // Set authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message || "Registration failed. Please try again.";
      throw new Error(errorMessage);
    }
  };

  const loginWithTokens = (
    accessToken: string,
    refreshToken: string | null,
    userData: User,
  ) => {
    localStorage.setItem("token", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
  };

  const logout = () => {
    // Clear storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");

    // Clear state
    setToken(null);
    setUser(null);

    // Remove authorization header
    delete api.defaults.headers.common["Authorization"];

    // Redirect to home
    window.location.href = "/";
  };

  const refreshUser = async () => {
    try {
      if (!token) return;

      const response = await api.get("/auth/profile");
      // Backend returns the user object directly inside data (not nested under .user)
      // Shape: { success: true, data: { id, full_name, email, ... role } }
      const userData = response.data.data;

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    loginWithTokens,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
