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
  shopId?: string | number;
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
