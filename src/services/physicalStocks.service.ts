import { apiRequest } from "./_helpers";
import type { PhysicalStock } from "@/types/inventory.types";
import type { ID } from "@/types/common.types";

export const physicalStocksService = {
  list: () => apiRequest<PhysicalStock[]>({ url: "/physical-stocks" }),
  create: (payload: Partial<PhysicalStock>) => apiRequest<PhysicalStock>({ method: "POST", url: "/physical-stocks", data: payload }),
  remove: (id: ID) => apiRequest<void>({ method: "DELETE", url: `/physical-stocks/${id}` }),
};
