import { apiRequest } from "./_helpers";
import type { ID } from "@/types/common.types";

/**
 * Backend wishlist rows carry only the ids — product name/image/price are looked
 * up separately from the product catalog. The API is customer-scoped:
 *   GET    /wishlist/customer/{customerId}
 *   POST   /wishlist/customer/{customerId}/product/{productId}
 *   DELETE /wishlist/customer/{customerId}/product/{productId}
 */
export interface WishlistItem {
  id: ID;
  productId: ID;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PageEnvelope<T> {
  content: T[];
}

export const wishlistService = {
  list: async (customerId: ID): Promise<WishlistItem[]> => {
    const env = await apiRequest<ApiEnvelope<PageEnvelope<WishlistItem>>>({
      url: `/wishlist/customer/${customerId}`,
      params: { size: 500 },
    });
    return env.data?.content ?? [];
  },

  add: (customerId: ID, productId: ID) =>
    apiRequest<ApiEnvelope<void>>({
      method: "POST",
      url: `/wishlist/customer/${customerId}/product/${productId}`,
    }),

  remove: (customerId: ID, productId: ID) =>
    apiRequest<ApiEnvelope<void>>({
      method: "DELETE",
      url: `/wishlist/customer/${customerId}/product/${productId}`,
    }),
};
