"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/axios";

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
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
        role: "user", // Specify user role
      });

      const { accessToken, user: userData } = response.data.data;

      // Store token and user
      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));

      setToken(accessToken);
      setUser(userData);

      // Set authorization header for future requests
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message || "Login failed. Please try again.";
      throw new Error(errorMessage);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post("/auth/register", data);

      const { accessToken, user: userData } = response.data.data;

      // Store token and user
      localStorage.setItem("token", accessToken);
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
      const userData = response.data.data.user;

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
