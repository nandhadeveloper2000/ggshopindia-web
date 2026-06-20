import type { ID } from "./common.types";

export interface Customer {
  id: ID;
  name: string;
  email?: string;
  mobile?: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface CustomerPayload {
  name: string;
  email?: string;
  mobile?: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isActive?: boolean;
}
