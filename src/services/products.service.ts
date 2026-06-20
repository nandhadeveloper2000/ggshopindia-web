import { apiRequest } from "./_helpers";
import type { Product, ProductApprovalStatus } from "@/types/product.types";
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

type BackendProductStatus = ProductApprovalStatus | "ACTIVE" | "INACTIVE";

interface BackendProductResponse {
  id: string;
  name?: string;
  sku?: string;
  categoryId?: string;
  categoryName?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  productTypeId?: string;
  productTypeName?: string;
  brandId?: string;
  brandName?: string;
  modelId?: string;
  modelName?: string;
  basePrice?: number;
  mrp?: number;
  images?: Array<string | Record<string, unknown>>;
  videos?: Array<string | Record<string, unknown>>;
  compatible?: unknown;
  variant?: unknown;
  productInformation?: unknown;
  dynamicFields?: Record<string, string>;
  dynamicFieldValues?: Record<string, string>;
  status?: BackendProductStatus;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function mapApprovalStatus(status?: BackendProductStatus): ProductApprovalStatus {
  if (status === "PENDING" || status === "REJECTED") return status;
  return "APPROVED";
}

function mapMedia(items?: Array<string | Record<string, unknown>>): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") return item;
      return item.url ?? item.src ?? item.imageUrl ?? item.path;
    })
    .filter((item): item is string => typeof item === "string" && item.length > 0);
}

function mapProduct(product: BackendProductResponse): Product {
  return {
    id: product.id,
    itemName: product.name ?? product.sku ?? "",
    sku: product.sku ?? "",
    categoryId: product.categoryId,
    categoryName: product.categoryName,
    subCategoryId: product.subCategoryId,
    subCategoryName: product.subCategoryName,
    productTypeId: product.productTypeId,
    productTypeName: product.productTypeName,
    brandId: product.brandId,
    brandName: product.brandName,
    modelId: product.modelId,
    modelName: product.modelName,
    images: mapMedia(product.images),
    videos: mapMedia(product.videos),
    dynamicFields: product.dynamicFields ?? product.dynamicFieldValues,
    approvalStatus: mapApprovalStatus(product.status),
    isActiveGlobal: product.active,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function toBackendPayload(payload: Partial<Product>) {
  const input = payload as Partial<Product> & Record<string, unknown>;
  const { itemName, approvalStatus, isActiveGlobal, images, videos, ...rest } = input;
  return {
    ...rest,
    name: itemName ?? rest.name,
    images: Array.isArray(images) ? images.map((url) => ({ url })) : images,
    videos: Array.isArray(videos) ? videos.map((url) => ({ url })) : videos,
  };
}

export const productsService = {
  list: async (params?: Record<string, unknown>): Promise<Product[]> => {
    const env = await apiRequest<ApiEnvelope<PageEnvelope<BackendProductResponse>>>({
      url: "/products",
      params: { size: 100, sortBy: "createdAt", sortDir: "desc", ...params },
    });
    return (env.data?.content ?? []).map(mapProduct);
  },

  get: async (id: ID): Promise<Product> => {
    const env = await apiRequest<ApiEnvelope<BackendProductResponse>>({ url: `/products/${id}` });
    return mapProduct(env.data);
  },

  create: async (payload: Partial<Product>): Promise<Product> => {
    const env = await apiRequest<ApiEnvelope<BackendProductResponse>>({
      method: "POST",
      url: "/products",
      data: toBackendPayload(payload),
    });
    return mapProduct(env.data);
  },

  update: async (id: ID, payload: Partial<Product>): Promise<Product> => {
    const env = await apiRequest<ApiEnvelope<BackendProductResponse>>({
      method: "PUT",
      url: `/products/${id}`,
      data: toBackendPayload(payload),
    });
    return mapProduct(env.data);
  },

  approve: async (id: ID): Promise<Product> => {
    const env = await apiRequest<ApiEnvelope<BackendProductResponse>>({ method: "PATCH", url: `/products/${id}/approve` });
    return mapProduct(env.data);
  },

  reject: async (id: ID, reason = "Rejected by admin"): Promise<Product> => {
    const env = await apiRequest<ApiEnvelope<BackendProductResponse>>({
      method: "PATCH",
      url: `/products/${id}/reject`,
      data: { reason },
    });
    return mapProduct(env.data);
  },

  toggleStatus: async (id: ID, active: boolean): Promise<Product> => {
    const env = await apiRequest<ApiEnvelope<BackendProductResponse>>({
      method: "PATCH",
      url: `/products/${id}/active`,
      params: { active },
    });
    return mapProduct(env.data);
  },

  remove: async (id: ID): Promise<void> => {
    await apiRequest<ApiEnvelope<void>>({ method: "DELETE", url: `/products/${id}` });
  },
};
