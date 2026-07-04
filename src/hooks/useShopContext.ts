"use client";
import { useShopStore } from "@/store/shop.store";

export function useShopContext() {
  const currentShopId = useShopStore((s) => s.currentShopId);
  const setCurrentShopId = useShopStore((s) => s.setCurrentShopId);
  const initForOwner = useShopStore((s) => s.initForOwner);
  return { currentShopId, setCurrentShopId, initForOwner };
}
