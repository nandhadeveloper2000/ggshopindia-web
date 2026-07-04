import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { API_BASE_URL, STORAGE_KEYS } from "./constants";
import { getLoginPortalFor } from "./portals";
import { setAuthCookies } from "./auth";
import type { AuthUser } from "@/types/auth.types";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(STORAGE_KEYS.accessToken);
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

function storedRole(): string | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? ((JSON.parse(raw) as AuthUser).role as string) : undefined;
  } catch {
    return undefined;
  }
}

function clearSessionAndRedirect() {
  const role = storedRole();
  const portal = role ? getLoginPortalFor(role) : "/login";
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.user);
  window.location.href = portal;
}

// De-duplicate concurrent refreshes: every request that 401s while a refresh is
// already in flight awaits the same promise instead of firing its own.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
  if (!refreshToken) return null;
  try {
    // Bare axios (no interceptors) so a failing refresh cannot recurse back here.
    const res = await axios.post(
      `${API_BASE_URL}/auth/refresh-token`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" }, timeout: 30000 }
    );
    const d = (res.data?.data ?? {}) as { accessToken?: string; refreshToken?: string };
    if (!d.accessToken) return null;
    localStorage.setItem(STORAGE_KEYS.accessToken, d.accessToken);
    if (d.refreshToken) localStorage.setItem(STORAGE_KEYS.refreshToken, d.refreshToken);
    setAuthCookies(d.accessToken, storedRole());
    return d.accessToken;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (typeof window === "undefined" || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Customer demo sessions carry a synthetic token the backend rejects. Never
    // tear such a session down on a 401 — let the caller fall back to empty data
    // so the demo shopper keeps browsing instead of being bounced to /login.
    if (localStorage.getItem(STORAGE_KEYS.demo) === "1") {
      return Promise.reject(error);
    }

    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    // Public pages (storefront home, login portals, the 403 page) must never be
    // force-redirected on a 401 — anonymous visitors hit authed endpoints
    // best-effort and should just see fallback content, not get bounced.
    const isPublic =
      path === "/" ||
      path === "/unauthorized" ||
      path === "/login" ||
      path === "/master" ||
      path === "/seller" ||
      path.startsWith("/auth");
    // The auth endpoints themselves (login / pin / otp / refresh) must not trigger
    // a refresh-retry — a 401 there is a genuine credential failure.
    const isAuthCall = (original?.url ?? "").includes("/auth/");

    // Access token likely expired — try to refresh once, then replay the request.
    if (
      original &&
      !original._retry &&
      !isAuthCall &&
      localStorage.getItem(STORAGE_KEYS.refreshToken)
    ) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return apiClient.request(original);
      }
    }

    // Refresh unavailable or failed → the session is really over. End it (unless
    // we are already on a public page, where a redirect would be wrong).
    if (!isPublic) {
      clearSessionAndRedirect();
    }
    return Promise.reject(error);
  }
);

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.request<T>(config);
  return res.data;
}

export function extractErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
