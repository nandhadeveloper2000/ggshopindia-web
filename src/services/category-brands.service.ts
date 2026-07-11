import { apiRequest } from "@/lib/axios";
import { fetchAllPages } from "./_helpers";
import type { ID } from "@/types/common.types";
import type { CategoryBrand } from "@/types/catalog.types";

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PageEnvelope<T> {
  content: T[];
  totalElements: number;
}

const BASE = "/catalog/product-type-brands";

const normalize = (cb: CategoryBrand): CategoryBrand => ({ ...cb, isActive: cb.isActive ?? cb.active });

const listRowsBy = async (params: Record<string, ID>): Promise<CategoryBrand[]> => {
  const rows = await fetchAllPages<CategoryBrand>((page, size) =>
    apiRequest<ApiEnvelope<PageEnvelope<CategoryBrand>>>({
      url: BASE,
      params: { page, size, ...params },
    }).then((env) => env.data),
  );
  return rows.map(normalize);
};

/**
 * Brands are mapped at the Product Type level. `list(categoryId)` returns the
 * distinct brands mapped anywhere under a category (storefront + product form),
 * while `listByProductType` / `listRows` return individual mapping rows.
 */
export const categoryBrandsService = {
  /** Distinct brands under a category. No id → all mapping rows (paged). */
  list: async (categoryId?: ID): Promise<CategoryBrand[]> => {
    if (categoryId) {
      const env = await apiRequest<ApiEnvelope<CategoryBrand[]>>({
        url: `${BASE}/brands-by-category/${categoryId}`,
      });
      return (env.data ?? []).map(normalize);
    }
    return listRowsBy({});
  },

  /** Mapping rows for one product type (Model form brand list + admin table). */
  listByProductType: (productTypeId: ID): Promise<CategoryBrand[]> => listRowsBy({ productTypeId }),

  /** Mapping rows filtered by any of category / sub-category / product type (admin table). */
  listRows: (filters: { categoryId?: ID; subCategoryId?: ID; productTypeId?: ID } = {}): Promise<CategoryBrand[]> => {
    const params: Record<string, ID> = {};
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.subCategoryId) params.subCategoryId = filters.subCategoryId;
    if (filters.productTypeId) params.productTypeId = filters.productTypeId;
    return listRowsBy(params);
  },

  /** Bulk map a product type to many brands. Returns the newly-created rows. */
  createBulk: async (productTypeId: ID, brandIds: ID[]): Promise<CategoryBrand[]> => {
    const env = await apiRequest<ApiEnvelope<CategoryBrand[]>>({
      method: "POST",
      url: BASE,
      data: { productTypeId, brandIds },
    });
    return env.data ?? [];
  },

  update: async (id: ID, payload: { productTypeId?: ID; brandId?: ID }): Promise<CategoryBrand> => {
    const env = await apiRequest<ApiEnvelope<CategoryBrand>>({
      method: "PUT",
      url: `${BASE}/${id}`,
      data: payload,
    });
    return normalize(env.data);
  },

  remove: (id: ID) => apiRequest<ApiEnvelope<void>>({ method: "DELETE", url: `${BASE}/${id}` }),
};
