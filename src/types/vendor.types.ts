import type { ID } from "./common.types";

export type VendorType = "SUPPLIER" | "DEALER" | "DISTRIBUTOR" | "VENDOR";

export interface Vendor {
  id: ID;
  vendorName: string;
  vendorType: VendorType;
  contactPerson?: string;
  email?: string;
  mobile?: string;
  gstNumber?: string;
  address?: string;
  shopId?: ID;
  isActive: boolean;
  createdAt?: string;
}

export interface VendorPayload {
  vendorName: string;
  vendorType: VendorType;
  contactPerson?: string;
  email?: string;
  mobile?: string;
  gstNumber?: string;
  address?: string;
  shopId?: ID;
  isActive?: boolean;
}
