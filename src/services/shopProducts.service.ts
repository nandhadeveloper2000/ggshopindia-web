import { apiRequest } from "./_helpers";
import type { ShopProduct } from "@/types/product.types";
import type { ID } from "@/types/common.types";

export const shopProductsService = {
  list: (shopId?: ID) => apiRequest<ShopProduct[]>({ url: "/shop-products", params: { shopId } }),
  get: (id: ID) => apiRequest<ShopProduct>({ url: `/shop-products/${id}` }),
  create: (payload: Partial<ShopProduct>) => apiRequest<ShopProduct>({ method: "POST", url: "/shop-products", data: payload }),
  update: (id: ID, payload: Partial<ShopProduct>) =>
    apiRequest<ShopProduct>({ method: "PUT", url: `/shop-products/${id}`, data: payload }),
  toggleStatus: (id: ID) => apiRequest<ShopProduct>({ method: "PATCH", url: `/shop-products/${id}/status` }),
  remove: (id: ID) => apiRequest<void>({ method: "DELETE", url: `/shop-products/${id}` }),
};
