import { apiRequest } from "./_helpers";
import type { Purchase } from "@/types/purchase.types";
import type { ID } from "@/types/common.types";

export const purchasesService = {
  list: () => apiRequest<Purchase[]>({ url: "/purchases" }),
  get: (id: ID) => apiRequest<Purchase>({ url: `/purchases/${id}` }),
  create: (payload: Partial<Purchase>) => apiRequest<Purchase>({ method: "POST", url: "/purchases", data: payload }),
  update: (id: ID, payload: Partial<Purchase>) => apiRequest<Purchase>({ method: "PUT", url: `/purchases/${id}`, data: payload }),
  returnItems: (id: ID, payload: Record<string, unknown>) =>
    apiRequest<Purchase>({ method: "POST", url: `/purchases/${id}/return`, data: payload }),
  remove: (id: ID) => apiRequest<void>({ method: "DELETE", url: `/purchases/${id}` }),
};
