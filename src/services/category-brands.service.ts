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

const normalize = (cb: CategoryBrand): CategoryBrand => ({ ...cb, isActive: cb.isActive ?? cb.active });

export const categoryBrandsService = {
  list: async (categoryId?: ID): Promise<CategoryBrand[]> => {
    const rows = await fetchAllPages<CategoryBrand>((page, size) =>
      apiRequest<ApiEnvelope<PageEnvelope<CategoryBrand>>>({
        url: "/catalog/category-brands",
        params: { page, size, ...(categoryId ? { categoryId } : {}) },
      }).then((env) => env.data),
    );
    return rows.map(normalize);
  },

  /** Bulk map a category to many brands. Returns the newly-created rows. */
  createBulk: async (categoryId: ID, brandIds: ID[]): Promise<CategoryBrand[]> => {
    const env = await apiRequest<ApiEnvelope<CategoryBrand[]>>({
      method: "POST",
      url: "/catalog/category-brands",
      data: { categoryId, brandIds },
    });
    return env.data ?? [];
  },

  update: async (id: ID, payload: { categoryId?: ID; brandId?: ID }): Promise<CategoryBrand> => {
    const env = await apiRequest<ApiEnvelope<CategoryBrand>>({
      method: "PUT",
      url: `/catalog/category-brands/${id}`,
      data: payload,
    });
    return normalize(env.data);
  },

  remove: (id: ID) => apiRequest<ApiEnvelope<void>>({ method: "DELETE", url: `/catalog/category-brands/${id}` }),
};
