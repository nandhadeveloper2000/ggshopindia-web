import type { ID } from "./common.types";
import type { PaymentMethod, PaymentStatus } from "./purchase.types";

export interface InvoiceItem {
  itemName: string;
  sku?: string;
  qty: number;
  price: number;
  tax?: number;
  discount?: number;
  total: number;
}

export interface Invoice {
  id: ID;
  invoiceNo: string;
  orderId?: ID;
  saleId?: ID;
  customerId?: ID;
  customerName?: string;
  shopId?: ID;
  shopName?: string;
  invoiceDate: string;
  items: InvoiceItem[];
  subTotal: number;
  taxAmount?: number;
  discountAmount?: number;
  grandTotal: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
}
