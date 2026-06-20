import type { ID } from "./common.types";

export interface CartItem {
  id: ID;
  productId: ID;
  shopProductId?: ID;
  itemName: string;
  sku?: string;
  imageUrl?: string;
  price: number;
  mrp?: number;
  qty: number;
  shopId?: ID;
  shopName?: string;
}

export interface Cart {
  id?: ID;
  items: CartItem[];
  subTotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
}
