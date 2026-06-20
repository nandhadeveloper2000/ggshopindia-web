import { apiRequest } from "./_helpers";

export interface Discount {
  id: string | number;
  code: string;
  description?: string;
  percent?: number;
  amount?: number;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
}

export const discountsService = {
  list: () => apiRequest<Discount[]>({ url: "/discounts" }),
  create: (payload: Partial<Discount>) => apiRequest<Discount>({ method: "POST", url: "/discounts", data: payload }),
  apply: (code: string) => apiRequest<Discount>({ method: "POST", url: "/discounts/apply", data: { code } }),
};
