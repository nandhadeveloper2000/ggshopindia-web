import { apiRequest } from "./_helpers";
import type { ShopOwner, ShopOwnerPayload } from "@/types/shop.types";
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

interface BackendShopOwnerResponse {
  id: string;
  userId?: string;
  fullName: string;
  email?: string;
  mobile?: string;
  businessName?: string;
  gstin?: string;
  pan?: string;
  profileImageUrl?: string;
  address?: Record<string, unknown>;
  active: boolean;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function mapShopOwner(owner: BackendShopOwnerResponse): ShopOwner {
  const addr = owner.address ?? {};
  return {
    id: owner.id,
    userId: owner.userId,
    name: owner.fullName,
    username: asString(addr.username),
    email: owner.email,
    mobile: owner.mobile,
    secondaryMobile: asString(addr.secondaryMobile),
    businessName: owner.businessName,
    gstin: owner.gstin,
    pan: owner.pan,
    profileImageUrl: owner.profileImageUrl,
    idProofUrl: asString(addr.idProofUrl),
    shopControl: asString(addr.shopControl),
    address: {
      state: asString(addr.state),
      district: asString(addr.district),
      taluk: asString(addr.taluk),
      area: asString(addr.area),
      street: asString(addr.street),
      pincode: asString(addr.pincode),
      username: asString(addr.username),
      shopControl: asString(addr.shopControl),
      secondaryMobile: asString(addr.secondaryMobile),
      pin: asString(addr.pin),
      idProofUrl: asString(addr.idProofUrl),
    },
    isActive: owner.active,
    isVerified: owner.verified,
    createdAt: owner.createdAt,
    updatedAt: owner.updatedAt,
  };
}

export const shopOwnersService = {
  list: async (): Promise<ShopOwner[]> => {
    const env = await apiRequest<ApiEnvelope<PageEnvelope<BackendShopOwnerResponse>>>({
      url: "/shop-owners",
      params: { size: 100, sortBy: "createdAt", sortDir: "desc" },
    });
    return (env.data?.content ?? []).map(mapShopOwner);
  },

  get: async (id: ID): Promise<ShopOwner> => {
    const env = await apiRequest<ApiEnvelope<BackendShopOwnerResponse>>({ url: `/shop-owners/${id}` });
    return mapShopOwner(env.data);
  },

  create: async (payload: ShopOwnerPayload): Promise<ShopOwner> => {
    const env = await apiRequest<ApiEnvelope<BackendShopOwnerResponse>>({
      method: "POST",
      url: "/shop-owners",
      data: payload,
    });
    return mapShopOwner(env.data);
  },

  update: async (id: ID, payload: ShopOwnerPayload): Promise<ShopOwner> => {
    const env = await apiRequest<ApiEnvelope<BackendShopOwnerResponse>>({
      method: "PUT",
      url: `/shop-owners/${id}`,
      data: payload,
    });
    return mapShopOwner(env.data);
  },

  toggleStatus: async (id: ID, active: boolean): Promise<void> => {
    await apiRequest<ApiEnvelope<void>>({
      method: "PATCH",
      url: `/shop-owners/${id}/active`,
      params: { active },
    });
  },

  verifyEmail: async (id: ID, verified: boolean): Promise<void> => {
    await apiRequest<ApiEnvelope<void>>({
      method: "PATCH",
      url: `/shop-owners/${id}/verified`,
      params: { verified },
    });
  },

  remove: async (id: ID): Promise<void> => {
    await apiRequest<ApiEnvelope<void>>({ method: "DELETE", url: `/shop-owners/${id}` });
  },
};

/**
 * Returns the profile completion percentage and a list of missing sections.
 * Five sections: basic, address, profile&docs, email-verified, business-locations.
 * Pass `locationCount` from the shops list keyed by owner id; default 0.
 */
export function computeProfileProgress(
  owner: ShopOwner,
  locationCount: number = 0
): { percent: number; completed: number; total: number; missing: string[] } {
  const sections: Array<{ name: string; ok: boolean }> = [
    {
      name: "Basic info",
      ok: Boolean(owner.name && owner.email && owner.mobile && owner.username),
    },
    {
      name: "Personal address",
      ok: Boolean(
        owner.address?.state &&
          owner.address?.district &&
          owner.address?.taluk &&
          owner.address?.area &&
          owner.address?.pincode
      ),
    },
    {
      name: "Profile & documents",
      ok: Boolean(owner.profileImageUrl && owner.idProofUrl),
    },
    { name: "Email verified", ok: Boolean(owner.isVerified) },
    { name: "Business location", ok: locationCount > 0 },
  ];
  const completed = sections.filter((s) => s.ok).length;
  return {
    percent: Math.round((completed / sections.length) * 100),
    completed,
    total: sections.length,
    missing: sections.filter((s) => !s.ok).map((s) => s.name),
  };
}
