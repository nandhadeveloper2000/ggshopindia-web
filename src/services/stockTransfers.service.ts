import { apiRequest } from "./_helpers";
import type { StockTransfer } from "@/types/inventory.types";
import type { ID } from "@/types/common.types";

export const stockTransfersService = {
  list: () => apiRequest<StockTransfer[]>({ url: "/stock-transfers" }),
  get: (id: ID) => apiRequest<StockTransfer>({ url: `/stock-transfers/${id}` }),
  create: (payload: Partial<StockTransfer>) => apiRequest<StockTransfer>({ method: "POST", url: "/stock-transfers", data: payload }),
  approve: (id: ID) => apiRequest<StockTransfer>({ method: "PATCH", url: `/stock-transfers/${id}/approve` }),
  reject: (id: ID) => apiRequest<StockTransfer>({ method: "PATCH", url: `/stock-transfers/${id}/reject` }),
  remove: (id: ID) => apiRequest<void>({ method: "DELETE", url: `/stock-transfers/${id}` }),
};
