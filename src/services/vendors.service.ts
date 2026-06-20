import { apiRequest } from "./_helpers";
import type { Vendor, VendorPayload } from "@/types/vendor.types";
import type { ID } from "@/types/common.types";

export const vendorsService = {
  list: () => apiRequest<Vendor[]>({ url: "/vendors" }),
  get: (id: ID) => apiRequest<Vendor>({ url: `/vendors/${id}` }),
  create: (payload: VendorPayload) => apiRequest<Vendor>({ method: "POST", url: "/vendors", data: payload }),
  update: (id: ID, payload: VendorPayload) => apiRequest<Vendor>({ method: "PUT", url: `/vendors/${id}`, data: payload }),
  toggleStatus: (id: ID) => apiRequest<Vendor>({ method: "PATCH", url: `/vendors/${id}/status` }),
  remove: (id: ID) => apiRequest<void>({ method: "DELETE", url: `/vendors/${id}` }),
};
