import { apiRequest } from "@/lib/axios";
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  OtpRequestPayload,
  OtpVerifyPayload,
  PinLoginPayload,
} from "@/types/auth.types";

// Backend response envelope
interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  errorCode?: string;
  timestamp?: string;
}

// Shape of /api/auth/* responses from the Spring Boot backend
interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  userId: string;
  username?: string;
  fullName: string;
  email?: string;
  mobile?: string;
  role: string;
  shopId?: string;
  customerId?: string;
  isCustomer?: boolean;
}

function mapAuth(envelope: ApiEnvelope<BackendAuthResponse>): LoginResponse {
  const d = envelope.data;
  const user: AuthUser = {
    id: d.userId,
    name: d.fullName,
    email: d.email,
    mobile: d.mobile,
    username: d.username,
    role: d.role,
    shopId: d.shopId,
    customerId: d.customerId,
  };
  return {
    accessToken: d.accessToken,
    refreshToken: d.refreshToken,
    user,
  };
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const env = await apiRequest<ApiEnvelope<BackendAuthResponse>>({
      method: "POST",
      url: "/auth/login",
      data: { identifier: payload.identifier, password: payload.password },
    });
    return mapAuth(env);
  },

  async requestOtp(payload: OtpRequestPayload): Promise<{ ok: boolean }> {
    await apiRequest({
      method: "POST",
      url: "/auth/request-otp",
      data: { identifier: payload.identifier, purpose: "LOGIN" },
    });
    return { ok: true };
  },

  async verifyOtp(payload: OtpVerifyPayload): Promise<LoginResponse> {
    const env = await apiRequest<ApiEnvelope<BackendAuthResponse>>({
      method: "POST",
      url: "/auth/verify-otp",
      data: { identifier: payload.identifier, otp: payload.otp, purpose: "LOGIN" },
    });
    return mapAuth(env);
  },

  async pinLogin(payload: PinLoginPayload): Promise<LoginResponse> {
    const env = await apiRequest<ApiEnvelope<BackendAuthResponse>>({
      method: "POST",
      url: "/auth/login-pin",
      data: { identifier: payload.identifier, pin: payload.pin },
    });
    return mapAuth(env);
  },

  async forgotPassword(identifier: string): Promise<{ ok: boolean }> {
    await apiRequest({
      method: "POST",
      url: "/auth/request-otp",
      data: { identifier, purpose: "PASSWORD_RESET" },
    });
    return { ok: true };
  },
};
