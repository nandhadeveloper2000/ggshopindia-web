import { DEMO_OTP, STORAGE_KEYS } from "@/lib/constants";
import { UserRole } from "@/lib/roles";
import type { AuthUser, LoginResponse } from "@/types/auth.types";

/**
 * Self-contained customer authentication for the Flipkart-style mobile + OTP
 * and signup flows. It issues a synthetic session so the storefront works as a
 * demo without a live backend, SMS gateway, or seeded customer. The fixed OTP
 * ({@link DEMO_OTP}, default `123456`) always verifies. Swap these functions for
 * real `/api/customer-auth/*` calls to go live.
 */

const PROFILE_PREFIX = "si_demo_customer:";

function readStorage(key: string): string | null {
  try {
    return typeof window !== "undefined" ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

/** Remember a shopper's name/email by mobile so returning demo logins greet them. */
export function rememberCustomer(mobile: string, name?: string, email?: string): void {
  try {
    if (typeof window === "undefined") return;
    const existing = recallCustomer(mobile);
    const merged = {
      name: name?.trim() || existing.name,
      email: email?.trim() || existing.email,
    };
    localStorage.setItem(PROFILE_PREFIX + mobile, JSON.stringify(merged));
  } catch {
    /* storage unavailable — non-fatal for a demo */
  }
}

export function recallCustomer(mobile: string): { name?: string; email?: string } {
  try {
    const raw = readStorage(PROFILE_PREFIX + mobile);
    return raw ? (JSON.parse(raw) as { name?: string; email?: string }) : {};
  } catch {
    return {};
  }
}

/** True when a mobile number has been used to sign up in this browser before. */
export function isRegistered(mobile: string): boolean {
  return readStorage(PROFILE_PREFIX + mobile) !== null;
}

export function isDemoOtp(otp: string): boolean {
  return otp.trim() === DEMO_OTP;
}

/** Build a synthetic customer session for the demo mobile-OTP / signup flow. */
export function buildDemoCustomerSession(input: {
  mobile: string;
  name?: string;
  email?: string;
}): LoginResponse {
  const profile = recallCustomer(input.mobile);
  const name = input.name?.trim() || profile.name || `Shopper ${input.mobile.slice(-4)}`;
  const email = input.email?.trim() || profile.email;

  const user: AuthUser = {
    id: `demo-${input.mobile}`,
    customerId: `demo-${input.mobile}`,
    name,
    mobile: input.mobile,
    email,
    role: UserRole.CUSTOMER,
  };

  // A non-JWT marker token. The backend will reject it (401), but the demo flag
  // set via markDemoSession() stops the axios layer from force-logging-out.
  const token = `demo.${encodeURIComponent(input.mobile)}.${Date.now().toString(36)}`;
  return { user, accessToken: token, refreshToken: token };
}

/** Flag the active session as a demo so the axios 401 handler leaves it alone. */
export function markDemoSession(): void {
  try {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEYS.demo, "1");
  } catch {
    /* non-fatal */
  }
}
