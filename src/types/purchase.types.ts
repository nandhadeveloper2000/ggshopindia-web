import type { ID } from "./common.types";

export type PurchaseTransactionType = "PURCHASE" | "PURCHASE_RETURN";
export type PaymentMethod = "CASH" | "UPI" | "CARD" | "CREDIT" | "BANK_TRANSFER" | "SPLIT";
export type PaymentStatus = "PAID" | "PARTIAL" | "PENDING";

export interface PurchaseItem {
  productId: ID;
  itemName?: string;
  sku?: string;
  qty: number;
  unit?: string;
  inputPrice: number;
  mrpPrice: number;
  sellingPrice: number;
  tax?: number;
  discount?: number;
  total?: number;
}

export interface Purchase {
  id: ID;
  transactionNo?: string;
  shopId: ID;
  vendorId: ID;
  vendorName?: string;
  vendorInvoiceNo?: string;
  transactionDate: string;
  items: PurchaseItem[];
  subTotal: number;
  taxAmount?: number;
  discountAmount?: number;
  grandTotal: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionType?: PurchaseTransactionType;
  notes?: string;
}
