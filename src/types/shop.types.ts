import type { ID } from "./common.types";

export type ShopType = "MAIN" | "BRANCH";
export type BusinessType = "RETAIL" | "WHOLESALE" | "RETAIL_WHOLESALE";
export type BillingType = "GST" | "NON_GST" | "BOTH";

export interface ShopOwnerAddress {
  state?: string;
  district?: string;
  taluk?: string;
  area?: string;
  street?: string;
  pincode?: string;
  username?: string;
  shopControl?: string;
  secondaryMobile?: string;
  pin?: string;
  idProofUrl?: string;
}

export interface ShopOwner {
  id: ID;
  userId?: ID;
  name: string;
  username?: string;
  email?: string;
  mobile?: string;
  secondaryMobile?: string;
  businessName?: string;
  gstin?: string;
  pan?: string;
  profileImageUrl?: string;
  idProofUrl?: string;
  shopControl?: string;
  address?: ShopOwnerAddress;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
}

export interface ShopOwnerPayload {
  fullName: string;
  email?: string;
  mobile?: string;
  businessName?: string;
  gstin?: string;
  pan?: string;
  profileImageUrl?: string;
  address?: Record<string, unknown>;
  /** Login credentials for the owner's User account. Required on create. */
  password?: string;
  pin?: string;
}

export interface ShopAddress {
  state?: string;
  district?: string;
  taluk?: string;
  area?: string;
  street?: string;
  addressLine?: string;
  pincode?: string;
}

export interface ShopSettings {
  businessType?: BusinessType;
  billingType?: BillingType;
  street?: string;
  documents?: {
    frontImageUrl?: string;
    gstCertificateUrl?: string;
    udyamCertificateUrl?: string;
  };
}

/**
 * Mirrors the backend ShopResponse DTO. Address and settings are JSON blobs.
 * The flat fields below (shopName, contactMobile, state, district, ...) are
 * retained for legacy callers and mirror what the backend `name` / `mobile` /
 * `address.state` / etc. would surface — populate them in the service mapper.
 */
export interface Shop {
  id: ID;
  shopOwnerId: ID;
  shopOwnerName?: string;
  // backend-native fields
  name?: string;
  nameKey?: string;
  shopType: ShopType;
  parentShopId?: ID;
  gstin?: string;
  pan?: string;
  mobile?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  frontImageUrl?: string;
  bannerImageUrl?: string;
  latitude?: number;
  longitude?: number;
  deliveryAvailable?: boolean;
  workingDays?: string;
  openingTime?: string;
  closingTime?: string;
  address?: ShopAddress;
  settings?: ShopSettings;
  // convenience / legacy flat fields (filled by the service mapper)
  shopName?: string;
  shopCode?: string;
  businessType?: BusinessType;
  billingType?: BillingType;
  contactMobile?: string;
  state?: string;
  district?: string;
  taluk?: string;
  area?: string;
  pincode?: string;
  ecommerceEnabled?: boolean;
  billingEnabled?: boolean;
  isActive: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
