import { apiRequest } from "./_helpers";
import type { Sale } from "@/types/sales.types";
import type { ID } from "@/types/common.types";

export const salesService = {
  list: () => apiRequest<Sale[]>({ url: "/sales" }),
  get: (id: ID) => apiRequest<Sale>({ url: `/sales/${id}` }),
  create: (payload: Partial<Sale>) => apiRequest<Sale>({ method: "POST", url: "/sales", data: payload }),
  returnItems: (id: ID, payload: Record<string, unknown>) =>
    apiRequest<Sale>({ method: "POST", url: `/sales/${id}/return`, data: payload }),
  remove: (id: ID) => apiRequest<void>({ method: "DELETE", url: `/sales/${id}` }),
};
