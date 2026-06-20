import { apiRequest } from "./_helpers";
import type { ID } from "@/types/common.types";

export interface ProductReview {
  id: ID;
  productId: ID;
  productName?: string;
  customerId?: ID;
  customerName?: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
}

export const reviewsService = {
  list: (productId?: ID) => apiRequest<ProductReview[]>({ url: "/reviews", params: { productId } }),
  create: (payload: Partial<ProductReview>) => apiRequest<ProductReview>({ method: "POST", url: "/reviews", data: payload }),
  remove: (id: ID) => apiRequest<void>({ method: "DELETE", url: `/reviews/${id}` }),
};
