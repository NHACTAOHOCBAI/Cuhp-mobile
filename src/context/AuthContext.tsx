import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { User } from "../types";
import { apiFetch, setUnauthorizedHandler } from "../api/client";

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (token: string, user: User, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      const currentToken = await SecureStore.getItemAsync("user-token");
      if (currentToken) {
        try {
          await apiFetch("/auth/logout", { method: "POST", token: currentToken });
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    } finally {
      await SecureStore.deleteItemAsync("user-token");
      await SecureStore.deleteItemAsync("user-refresh-token");
      await SecureStore.deleteItemAsync("user-data");
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });

    const bootstrapAsync = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("user-token");
        const storedUser = await SecureStore.getItemAsync("user-data");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.warn("Lỗi khôi phục session đăng nhập:", e);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();
  }, [logout]);

  const login = async (newToken: string, newUser: User, newRefreshToken?: string) => {
    try {
      await SecureStore.setItemAsync("user-token", newToken);
      await SecureStore.setItemAsync("user-data", JSON.stringify(newUser));
      if (newRefreshToken) {
        await SecureStore.setItemAsync("user-refresh-token", newRefreshToken);
      }
      setToken(newToken);
      setUser(newUser);
    } catch (e) {
      console.error("Lỗi lưu trữ thông tin đăng nhập:", e);
      throw new Error("Không thể lưu trữ session đăng nhập");
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const { fetchUserProfile } = require("../api/client");
      const updatedUser = await fetchUserProfile(token);
      if (updatedUser) {
        await SecureStore.setItemAsync("user-data", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (e) {
      console.warn("Lỗi refresh user profile:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  }
  return context;
};
