"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ID } from "@/types/common.types";

interface ShopState {
  currentShopId: ID | null;
  /** The shop owner the current selection belongs to; used to reset on a new login. */
  boundOwnerId: string | null;
  setCurrentShopId: (id: ID | null) => void;
  /**
   * Binds the selection to a shop owner. The first time it is called for a new
   * owner (e.g. a fresh login), the selection defaults to `defaultShopId` (the
   * MAIN location). Later calls for the same owner keep whatever the user has
   * since chosen, so a manual "All Locations" pick still sticks.
   */
  initForOwner: (ownerId: string, defaultShopId: ID | null) => void;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      currentShopId: null,
      boundOwnerId: null,
      setCurrentShopId: (id) => set({ currentShopId: id }),
      initForOwner: (ownerId, defaultShopId) => {
        if (get().boundOwnerId === ownerId) return;
        set({ boundOwnerId: ownerId, currentShopId: defaultShopId });
      },
    }),
    { name: "si_shop_ctx" }
  )
);
