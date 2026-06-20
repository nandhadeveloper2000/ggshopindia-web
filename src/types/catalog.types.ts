import type { ID } from "./common.types";

export interface Category {
  id: ID;
  name: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface SubCategory {
  id: ID;
  categoryId: ID;
  categoryName?: string;
  name: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface Brand {
  id: ID;
  name: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface ProductType {
  id: ID;
  name: string;
  isActive: boolean;
}

export interface ProductModel {
  id: ID;
  brandId: ID;
  brandName?: string;
  name: string;
  year?: number;
  description?: string;
  isActive: boolean;
}

export interface ProductAttribute {
  id: ID;
  name: string;
  values: string[];
  isActive: boolean;
}

export interface ProductCompatibility {
  id: ID;
  productId: ID;
  brandId: ID;
  modelId: ID;
}
