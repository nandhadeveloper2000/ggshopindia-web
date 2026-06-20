import { apiRequest } from "./_helpers";
import type { Invoice } from "@/types/invoice.types";
import type { ID } from "@/types/common.types";

export const invoicesService = {
  list: () => apiRequest<Invoice[]>({ url: "/invoices" }),
  get: (id: ID) => apiRequest<Invoice>({ url: `/invoices/${id}` }),
  downloadPdf: (id: ID) => apiRequest<Blob>({ url: `/invoices/${id}/pdf`, responseType: "blob" }),
};
