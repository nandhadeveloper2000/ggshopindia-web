"use client";
import { useShopStore } from "@/store/shop.store";

export function useShopContext() {
  const currentShopId = useShopStore((s) => s.currentShopId);
  const setCurrentShopId = useShopStore((s) => s.setCurrentShopId);
  return { currentShopId, setCurrentShopId };
}
