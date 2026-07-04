import type { ID } from "./common.types";

export type ProductApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
// Matches backend enum com.qmatrix.stockinventory.common.enums.PricingType
export type PricingType = "SINGLE" | "BULK";

export interface ProductVariant {
  id?: ID;
  name: string;
  sku: string;
  price?: number;
  mrp?: number;
  stock?: number;
  attributes?: Record<string, string>;
}

export interface ProductInformationField {
  label: string;
  value: string;
}

export interface Product {
  id: ID;
  itemName: string;
  sku: string;
  categoryId?: ID;
  categoryName?: string;
  subCategoryId?: ID;
  subCategoryName?: string;
  productTypeId?: ID;
  productTypeName?: string;
  brandId?: ID;
  brandName?: string;
  modelId?: ID;
  modelName?: string;
  images?: string[];
  videos?: string[];
  compatibleBrands?: ID[];
  compatibleModels?: ID[];
  variants?: ProductVariant[];
  /** Raw variation-builder payload ({ types, values, rows }) round-tripped for editing. */
  variant?: unknown;
  productInformation?: ProductInformationField[];
  dynamicFields?: Record<string, string>;
  approvalStatus: ProductApprovalStatus;
  isActiveGlobal: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShopProduct {
  id: ID;
  productId: ID;
  shopId: ID;
  sku: string;
  itemCode?: string;
  itemName?: string;
  categoryName?: string;
  brandName?: string;
  modelName?: string;
  unit?: string;
  qty: number;
  lowStockQty?: number;
  inputPrice: number;
  mrpPrice: number;
  sellingPrice: number;
  minSellingPrice?: number;
  pricingType?: PricingType;
  vendorId?: ID;
  vendorName?: string;
  batch?: string;
  isActive: boolean;
  imageUrl?: string;
}
