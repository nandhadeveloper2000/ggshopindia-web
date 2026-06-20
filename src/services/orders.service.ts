import { apiRequest } from "./_helpers";
import type { Order, OrderStatus } from "@/types/order.types";
import type { ID } from "@/types/common.types";

export const ordersService = {
  list: () => apiRequest<Order[]>({ url: "/orders" }),
  get: (id: ID) => apiRequest<Order>({ url: `/orders/${id}` }),
  create: (payload: Partial<Order>) => apiRequest<Order>({ method: "POST", url: "/orders", data: payload }),
  updateStatus: (id: ID, status: OrderStatus) =>
    apiRequest<Order>({ method: "PATCH", url: `/orders/${id}/status`, data: { status } }),
  cancel: (id: ID) => apiRequest<Order>({ method: "POST", url: `/orders/${id}/cancel` }),
};
