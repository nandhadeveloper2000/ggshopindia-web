import { apiRequest } from "./_helpers";
import type {
  BillingType,
  BusinessType,
  Shop,
  ShopAddress,
  ShopSettings,
} from "@/types/shop.types";
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

interface BackendShopResponse {
  id: string;
  shopOwnerId: string;
  name?: string;
  nameKey?: string;
  shopType: Shop["shopType"];
  parentShopId?: string;
  gstin?: string;
  pan?: string;
  mobile?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  address?: Record<string, unknown>;
  bankDetails?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  active: boolean;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function s(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function mapShop(shop: BackendShopResponse): Shop {
  const addr = (shop.address ?? {}) as Record<string, unknown>;
  const settings = (shop.settings ?? {}) as Record<string, unknown>;
  const docsRaw = (settings.documents ?? {}) as Record<string, unknown>;
  const address: ShopAddress = {
    state: s(addr.state),
    district: s(addr.district),
    taluk: s(addr.taluk),
    area: s(addr.area),
    street: s(addr.street) ?? s(settings.street),
    pincode: s(addr.pincode),
  };
  const shopSettings: ShopSettings = {
    businessType: s(settings.businessType) as BusinessType | undefined,
    billingType: s(settings.billingType) as BillingType | undefined,
    street: s(settings.street),
    documents: {
      frontImageUrl: s(docsRaw.frontImageUrl),
      gstCertificateUrl: s(docsRaw.gstCertificateUrl),
      udyamCertificateUrl: s(docsRaw.udyamCertificateUrl),
    },
  };
  return {
    id: shop.id,
    shopOwnerId: shop.shopOwnerId,
    name: shop.name,
    nameKey: shop.nameKey,
    shopType: shop.shopType,
    parentShopId: shop.parentShopId,
    gstin: shop.gstin,
    pan: shop.pan,
    mobile: shop.mobile,
    email: shop.email,
    website: shop.website,
    logoUrl: shop.logoUrl,
    address,
    settings: shopSettings,
    // flat convenience fields
    shopName: shop.name,
    shopCode: shop.nameKey,
    businessType: shopSettings.businessType,
    billingType: shopSettings.billingType,
    contactMobile: shop.mobile,
    state: address.state,
    district: address.district,
    taluk: address.taluk,
    area: address.area,
    pincode: address.pincode,
    isActive: shop.active,
    isVerified: shop.verified,
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt,
  };
}

interface ShopWritePayload extends Partial<Shop> {
  // Inputs that aren't on the Shop type but are common form fields.
  gstNumber?: string;
  frontImageUrl?: string;
  gstCertificateUrl?: string;
  udyamCertificateUrl?: string;
  street?: string;
  parentShopId?: string;
}

function blank(v: string | undefined | null): string | undefined {
  const t = typeof v === "string" ? v.trim() : v;
  return t ? (t as string) : undefined;
}

function toBackendPayload(payload: ShopWritePayload) {
  return {
    shopOwnerId: payload.shopOwnerId,
    name: blank(payload.shopName ?? payload.name),
    shopType: payload.shopType,
    parentShopId: blank(payload.parentShopId),
    gstin: blank(payload.gstNumber ?? payload.gstin),
    mobile: blank(payload.contactMobile ?? payload.mobile),
    address: {
      state: blank(payload.state),
      district: blank(payload.district),
      taluk: blank(payload.taluk),
      area: blank(payload.area),
      street: blank(payload.street),
      pincode: blank(payload.pincode),
    },
    settings: {
      businessType: payload.businessType,
      billingType: payload.billingType,
      street: blank(payload.street),
      documents: {
        frontImageUrl: blank(payload.frontImageUrl),
        gstCertificateUrl: blank(payload.gstCertificateUrl),
        udyamCertificateUrl: blank(payload.udyamCertificateUrl),
      },
    },
  };
}

export const shopsService = {
  list: async (): Promise<Shop[]> => {
    const env = await apiRequest<ApiEnvelope<PageEnvelope<BackendShopResponse>>>({
      url: "/shops",
      params: { size: 200, sortBy: "createdAt", sortDir: "desc" },
    });
    return (env.data?.content ?? []).map(mapShop);
  },

  get: async (id: ID): Promise<Shop> => {
    const env = await apiRequest<ApiEnvelope<BackendShopResponse>>({ url: `/shops/${id}` });
    return mapShop(env.data);
  },

  create: async (payload: ShopWritePayload): Promise<Shop> => {
    const env = await apiRequest<ApiEnvelope<BackendShopResponse>>({
      method: "POST",
      url: "/shops",
      data: toBackendPayload(payload),
    });
    return mapShop(env.data);
  },

  update: async (id: ID, payload: ShopWritePayload): Promise<Shop> => {
    const env = await apiRequest<ApiEnvelope<BackendShopResponse>>({
      method: "PUT",
      url: `/shops/${id}`,
      data: toBackendPayload(payload),
    });
    return mapShop(env.data);
  },

  toggleStatus: async (id: ID, active: boolean): Promise<void> => {
    await apiRequest<ApiEnvelope<void>>({ method: "PATCH", url: `/shops/${id}/active`, params: { active } });
  },

  remove: async (id: ID): Promise<void> => {
    await apiRequest<ApiEnvelope<void>>({ method: "DELETE", url: `/shops/${id}` });
  },
};
