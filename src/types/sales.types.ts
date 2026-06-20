import type { ID } from "./common.types";
import type { PaymentMethod, PaymentStatus } from "./purchase.types";

export type SaleTransactionType = "SALE" | "SALE_RETURN";

export interface SaleItem {
  productId: ID;
  itemName?: string;
  sku?: string;
  qty: number;
  unit?: string;
  price: number;
  tax?: number;
  discount?: number;
  total?: number;
}

export interface Sale {
  id: ID;
  transactionNo: string;
  invoiceNo?: string;
  shopId: ID;
  customerId?: ID;
  customerName?: string;
  transactionDate: string;
  items: SaleItem[];
  subTotal: number;
  taxAmount?: number;
  discountAmount?: number;
  grandTotal: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionType?: SaleTransactionType;
  notes?: string;
}
