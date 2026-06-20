import { apiRequest } from "./_helpers";
import type { Cart, CartItem } from "@/types/cart.types";

export const cartsService = {
  get: () => apiRequest<Cart>({ url: "/cart" }),
  add: (payload: Partial<CartItem>) => apiRequest<Cart>({ method: "POST", url: "/cart/items", data: payload }),
  update: (id: CartItem["id"], qty: number) =>
    apiRequest<Cart>({ method: "PATCH", url: `/cart/items/${id}`, data: { qty } }),
  remove: (id: CartItem["id"]) => apiRequest<Cart>({ method: "DELETE", url: `/cart/items/${id}` }),
  clear: () => apiRequest<Cart>({ method: "DELETE", url: "/cart" }),
};
