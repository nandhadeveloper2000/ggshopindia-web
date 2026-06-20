import { apiRequest } from "./_helpers";
import type { User } from "@/types/user.types";
import type { ID } from "@/types/common.types";

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PageEnvelope<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// Shape returned by /api/users/* on the Spring Boot side
interface BackendUserResponse {
  id: string;
  username?: string;
  email?: string;
  mobile?: string;
  fullName?: string;
  role: string;
  shopId?: string;
  shopOwnerId?: string;
  active: boolean;
  locked?: boolean;
  emailVerified?: boolean;
  mobileVerified?: boolean;
  profileImageUrl?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

function mapUser(u: BackendUserResponse): User {
  return {
    id: u.id,
    name: u.fullName ?? u.username ?? "",
    username: u.username,
    email: u.email,
    mobile: u.mobile,
    role: u.role,
    isActive: u.active,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export interface UserCreatePayload {
  fullName: string;
  username: string;
  email?: string;
  mobile?: string;
  role: string;
  password: string;
  pin?: string;
}

export interface UserUpdatePayload {
  fullName?: string;
  email?: string;
  mobile?: string;
  password?: string;
  pin?: string;
  profileImageUrl?: string;
}

export const usersService = {
  list: async (): Promise<User[]> => {
    const env = await apiRequest<ApiEnvelope<PageEnvelope<BackendUserResponse>>>({
      url: "/users",
      params: { size: 100, sortBy: "createdAt", sortDir: "desc" },
    });
    return (env.data?.content ?? []).map(mapUser);
  },

  get: async (id: ID): Promise<User> => {
    const env = await apiRequest<ApiEnvelope<BackendUserResponse>>({ url: `/users/${id}` });
    return mapUser(env.data);
  },

  create: async (payload: UserCreatePayload): Promise<User> => {
    const env = await apiRequest<ApiEnvelope<BackendUserResponse>>({
      method: "POST",
      url: "/users",
      data: payload,
    });
    return mapUser(env.data);
  },

  update: async (id: ID, payload: UserUpdatePayload): Promise<User> => {
    const env = await apiRequest<ApiEnvelope<BackendUserResponse>>({
      method: "PUT",
      url: `/users/${id}`,
      data: payload,
    });
    return mapUser(env.data);
  },

  toggleStatus: async (id: ID, active: boolean): Promise<void> => {
    await apiRequest<ApiEnvelope<void>>({
      method: "PATCH",
      url: `/users/${id}/active`,
      params: { active },
    });
  },

  remove: async (id: ID): Promise<void> => {
    await apiRequest<ApiEnvelope<void>>({ method: "DELETE", url: `/users/${id}` });
  },
};
