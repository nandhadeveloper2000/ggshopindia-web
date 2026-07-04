"use client";
import { create } from "zustand";
import { STORAGE_KEYS } from "@/lib/constants";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth";
import type { AuthUser } from "@/types/auth.types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setSession: (user: AuthUser, accessToken: string, refreshToken?: string) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  hasHydrated: false,

  setSession: (user, accessToken, refreshToken) => {
    if (typeof window !== "undefined") {
      // Clear any stale demo marker; the demo flow re-sets it after this call.
      localStorage.removeItem(STORAGE_KEYS.demo);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
      if (refreshToken) localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
      setAuthCookies(accessToken, String(user.role));
    }
    set({ user, accessToken, refreshToken: refreshToken ?? null, isAuthenticated: true });
  },

  updateUser: (user) => {
    const current = get().user;
    if (!current) return;
    const next = { ...current, ...user };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next));
    }
    set({ user: next });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.user);
      localStorage.removeItem(STORAGE_KEYS.accessToken);
      localStorage.removeItem(STORAGE_KEYS.refreshToken);
      localStorage.removeItem(STORAGE_KEYS.shopId);
      localStorage.removeItem(STORAGE_KEYS.demo);
      clearAuthCookies();
    }
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    const rawUser = localStorage.getItem(STORAGE_KEYS.user);
    const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
    if (rawUser && accessToken) {
      try {
        const user = JSON.parse(rawUser) as AuthUser;
        setAuthCookies(accessToken, String(user.role));
        set({ user, accessToken, refreshToken, isAuthenticated: true, hasHydrated: true });
        return;
      } catch {
        // fall through to mark hydrated even if parsing failed
      }
    }
    set({ hasHydrated: true });
  },
}));
