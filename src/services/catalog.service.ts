import { apiRequest, fetchAllPages } from "./_helpers";
import type {
  Brand,
  Category,
  ProductAttribute,
  ProductCompatibility,
  ProductModel,
  ProductType,
  SubCategory,
} from "@/types/catalog.types";
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

interface ResourceWithActive {
  id: ID;
  isActive?: boolean;
  active?: boolean;
}

function normalize<T extends ResourceWithActive>(item: T): T {
  // Backend uses `active`; frontend code reads `isActive`.
  if (item.isActive === undefined && typeof item.active === "boolean") {
    return { ...item, isActive: item.active };
  }
  return item;
}

function makeCatalogService<T extends ResourceWithActive>(base: string) {
  return {
    list: async (): Promise<T[]> => {
      const rows = await fetchAllPages<T>(async (page, size) => {
        const env = await apiRequest<ApiEnvelope<PageEnvelope<T> | T[]>>({
          url: base,
          params: { page, size },
        });
        const data = env.data;
        // A few endpoints return a bare array instead of a page envelope.
        return Array.isArray(data) ? { content: data, last: true } : data;
      });
      return rows.map(normalize);
    },

    get: async (id: ID): Promise<T> => {
      const env = await apiRequest<ApiEnvelope<T>>({ url: `${base}/${id}` });
      return normalize(env.data);
    },

    create: async (payload: Partial<T>): Promise<T> => {
      const env = await apiRequest<ApiEnvelope<T>>({
        method: "POST",
        url: base,
        data: payload,
      });
      return normalize(env.data);
    },

    update: async (id: ID, payload: Partial<T>): Promise<T> => {
      const env = await apiRequest<ApiEnvelope<T>>({
        method: "PUT",
        url: `${base}/${id}`,
        data: payload,
      });
      return normalize(env.data);
    },

    /** Pass the new active value. If omitted, flips the current value of `current`. */
    toggleStatus: async (id: ID, active?: boolean, current?: T): Promise<void> => {
      const next =
        typeof active === "boolean"
          ? active
          : !(current?.isActive ?? current?.active ?? true);
      await apiRequest<ApiEnvelope<void>>({
        method: "PATCH",
        url: `${base}/${id}/active`,
        params: { active: next },
      });
    },

    remove: async (id: ID): Promise<void> => {
      await apiRequest<ApiEnvelope<void>>({ method: "DELETE", url: `${base}/${id}` });
    },
  };
}

export const categoriesService = makeCatalogService<Category>("/catalog/categories");
export const subCategoriesService = makeCatalogService<SubCategory>("/catalog/sub-categories");
export const brandsService = makeCatalogService<Brand>("/catalog/brands");
export const productTypesService = makeCatalogService<ProductType>("/catalog/product-types");
export const modelsService = makeCatalogService<ProductModel>("/catalog/models");
export const productAttributesService = makeCatalogService<ProductAttribute>(
  "/catalog/product-attributes"
);
export const productCompatibilitiesService = makeCatalogService<ProductCompatibility>(
  "/catalog/product-compatibilities"
);
