"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "./api";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role?: string; city?: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("mymove_token");
    const savedUser = localStorage.getItem("mymove_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem("mymove_token", res.token);
    localStorage.setItem("mymove_user", JSON.stringify(res.user));
  };

  const register = async (data: { name: string; email: string; password: string; role?: string; city?: string }) => {
    const res = await api.register(data);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem("mymove_token", res.token);
    localStorage.setItem("mymove_user", JSON.stringify(res.user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("mymove_token");
    localStorage.removeItem("mymove_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
