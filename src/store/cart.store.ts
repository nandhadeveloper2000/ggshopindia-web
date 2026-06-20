"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types/cart.types";

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQty: (productId: CartItem["productId"], qty: number) => void;
  removeItem: (productId: CartItem["productId"]) => void;
  clear: () => void;
  count: () => number;
  subTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items.slice();
        const idx = items.findIndex((i) => i.productId === item.productId);
        if (idx >= 0) {
          items[idx] = { ...items[idx], qty: items[idx].qty + item.qty };
        } else {
          items.push(item);
        }
        set({ items });
      },
      updateQty: (productId, qty) => {
        const items = get().items.map((i) => (i.productId === productId ? { ...i, qty } : i));
        set({ items });
      },
      removeItem: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((acc, i) => acc + i.qty, 0),
      subTotal: () => get().items.reduce((acc, i) => acc + i.price * i.qty, 0),
    }),
    { name: "si_cart" }
  )
);
