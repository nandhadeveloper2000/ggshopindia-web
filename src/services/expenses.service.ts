import { apiRequest } from "./_helpers";
import type { ID } from "@/types/common.types";

export interface Expense {
  id: ID;
  shopId?: ID;
  expenseDate: string;
  category: string;
  amount: number;
  paymentMethod: string;
  referenceNo?: string;
  attachmentUrl?: string;
  notes?: string;
  isActive?: boolean;
}

export const expensesService = {
  list: () => apiRequest<Expense[]>({ url: "/expenses" }),
  create: (payload: Partial<Expense>) => apiRequest<Expense>({ method: "POST", url: "/expenses", data: payload }),
  update: (id: ID, payload: Partial<Expense>) => apiRequest<Expense>({ method: "PUT", url: `/expenses/${id}`, data: payload }),
  remove: (id: ID) => apiRequest<void>({ method: "DELETE", url: `/expenses/${id}` }),
};
