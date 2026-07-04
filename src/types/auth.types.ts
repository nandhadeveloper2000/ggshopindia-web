import type { UserRoleType } from "@/lib/roles";

export type LoginMethod = "PASSWORD" | "OTP" | "PIN";

export interface AuthUser {
  id: string | number;
  name: string;
  email?: string;
  username?: string;
  mobile?: string;
  role: UserRoleType | string;
  avatarUrl?: string;
  /** Present for a Business Location login — the one shop this user is scoped to. */
  shopId?: string | number;
  /** Present for a Shop Owner (and location) login — the owner account they belong to. */
  shopOwnerId?: string | number;
  customerId?: string | number;
  vendorId?: string | number;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
  remember?: boolean;
}

export interface OtpRequestPayload {
  identifier: string;
}

export interface OtpVerifyPayload {
  identifier: string;
  otp: string;
}

export interface PinLoginPayload {
  identifier: string;
  pin: string;
}
