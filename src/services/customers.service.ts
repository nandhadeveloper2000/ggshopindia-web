import { apiRequest } from "./_helpers";
import type { Customer, CustomerPayload } from "@/types/customer.types";
import type { ID } from "@/types/common.types";

export const customersService = {
  list: () => apiRequest<Customer[]>({ url: "/customers" }),
  get: (id: ID) => apiRequest<Customer>({ url: `/customers/${id}` }),
  create: (payload: CustomerPayload) => apiRequest<Customer>({ method: "POST", url: "/customers", data: payload }),
  update: (id: ID, payload: CustomerPayload) => apiRequest<Customer>({ method: "PUT", url: `/customers/${id}`, data: payload }),
  toggleStatus: (id: ID) => apiRequest<Customer>({ method: "PATCH", url: `/customers/${id}/status` }),
  remove: (id: ID) => apiRequest<void>({ method: "DELETE", url: `/customers/${id}` }),
};
