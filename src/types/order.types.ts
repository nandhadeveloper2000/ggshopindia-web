import type { ID } from "./common.types";
import type { PaymentMethod, PaymentStatus } from "./purchase.types";

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export interface OrderItem {
  productId: ID;
  itemName: string;
  sku?: string;
  imageUrl?: string;
  qty: number;
  price: number;
  total: number;
}

export interface Order {
  id: ID;
  orderNo: string;
  customerId: ID;
  customerName?: string;
  shopId?: ID;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  subTotal: number;
  taxAmount?: number;
  discountAmount?: number;
  shippingAmount?: number;
  grandTotal: number;
  shippingAddress?: string;
  billingAddress?: string;
  createdAt: string;
  updatedAt?: string;
  invoiceId?: ID;
}
