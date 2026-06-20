import { apiRequest } from "./_helpers";
import type { ID } from "@/types/common.types";

export interface WishlistItem {
  id: ID;
  productId: ID;
  itemName: string;
  imageUrl?: string;
  price: number;
  mrp?: number;
}

export const wishlistService = {
  list: () => apiRequest<WishlistItem[]>({ url: "/wishlist" }),
  add: (productId: ID) => apiRequest<WishlistItem>({ method: "POST", url: "/wishlist", data: { productId } }),
  remove: (id: ID) => apiRequest<void>({ method: "DELETE", url: `/wishlist/${id}` }),
};
