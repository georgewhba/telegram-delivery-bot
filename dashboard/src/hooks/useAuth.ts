import { createContext, useContext, useState, useCallback, createElement, type ReactNode } from "react";
import { api, getToken, setToken, ApiError } from "../api/client";

interface AdminInfo {
  id: number;
  username: string;
}

interface AuthContextValue {
  admin: AdminInfo | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.loginRequest(username, password);
      setToken(res.token);
      setAdmin(res.admin);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "تعذر تسجيل الدخول";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
    window.location.href = "/login";
  }, []);

  const value: AuthContextValue = {
    admin,
    isAuthenticated: !!getToken(),
    login,
    logout,
    loading,
    error,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
