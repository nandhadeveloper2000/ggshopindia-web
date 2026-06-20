import type { ID } from "./common.types";

export type TransferType = "FORWARD" | "REVERSE";
export type TransferStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface StockTransferItem {
  productId: ID;
  itemName?: string;
  sku?: string;
  qty: number;
}

export interface StockTransfer {
  id: ID;
  fromShopId: ID;
  toShopId: ID;
  fromShopName?: string;
  toShopName?: string;
  transferType: TransferType;
  status: TransferStatus;
  items: StockTransferItem[];
  notes?: string;
  createdAt?: string;
}

export interface PhysicalStock {
  id: ID;
  shopId: ID;
  shopName?: string;
  productId: ID;
  itemName?: string;
  systemQty: number;
  physicalQty: number;
  differenceQty: number;
  notes?: string;
  createdAt?: string;
}
