"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ID } from "@/types/common.types";

interface ShopState {
  currentShopId: ID | null;
  setCurrentShopId: (id: ID | null) => void;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      currentShopId: null,
      setCurrentShopId: (id) => set({ currentShopId: id }),
    }),
    { name: "si_shop_ctx" }
  )
);
