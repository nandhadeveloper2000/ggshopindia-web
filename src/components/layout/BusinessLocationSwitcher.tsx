"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Check, ChevronsUpDown, Store } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth.store";
import { useSidebarStore } from "@/store/sidebar.store";
import { useShopContext } from "@/hooks/useShopContext";
import { shopsService } from "@/services/shops.service";
import { cn } from "@/lib/utils";

const nameOf = (s?: { shopName?: string; name?: string } | null) =>
  s?.shopName ?? s?.name ?? "Location";

/**
 * Sidebar-top business-location selector for the seller portal.
 * - Shop Owner: switch between all their locations (or "All Locations").
 * - Business Location login: shows its single, locked location (not switchable).
 * The selection is stored in the shop context so pages can scope to it.
 */
export function BusinessLocationSwitcher() {
  const user = useAuthStore((s) => s.user);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const { currentShopId, setCurrentShopId, initForOwner } = useShopContext();

  const isLocationUser = Boolean(user?.shopId);
  const ownerId = user?.shopOwnerId ? String(user.shopOwnerId) : null;
  const lockedShopId = user?.shopId ? String(user.shopId) : null;

  const { data: shops = [] } = useQuery({
    queryKey: ["location-switcher", ownerId, lockedShopId],
    enabled: Boolean(user) && (Boolean(ownerId) || Boolean(lockedShopId)),
    queryFn: async () => {
      if (lockedShopId) return [await shopsService.get(lockedShopId)];
      if (ownerId) return shopsService.getByOwner(ownerId);
      return [];
    },
  });

  const current = useMemo(
    () => shops.find((s) => String(s.id) === String(currentShopId)) ?? null,
    [shops, currentShopId]
  );

  // On a shop-owner login, default the selection to their MAIN location
  // (falling back to the first shop) instead of "All Locations".
  useEffect(() => {
    if (isLocationUser || !ownerId || shops.length === 0) return;
    const main = shops.find((s) => s.shopType === "MAIN") ?? shops[0];
    initForOwner(ownerId, main?.id ?? null);
  }, [isLocationUser, ownerId, shops, initForOwner]);

  // Nothing to show for non-seller users or before shops load.
  if (!user || (!ownerId && !lockedShopId) || shops.length === 0) return null;

  const label = isLocationUser ? nameOf(shops[0]) : current ? nameOf(current) : "All Locations";
  const sublabel = isLocationUser ? "Business Location" : "Current Location";

  const trigger = (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-2 text-left text-white/85 transition-colors hover:bg-white/10",
        collapsed && "justify-center px-2"
      )}
      title={isLocationUser ? label : "Switch business location"}
    >
      <Store className="h-4 w-4 shrink-0 text-white/60" />
      {!collapsed && (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-tight">{label}</p>
            <p className="text-[10px] leading-tight text-white/45">{sublabel}</p>
          </div>
          {!isLocationUser && (
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-white/50" />
          )}
        </>
      )}
    </button>
  );

  // A location login is locked to its one shop — show it, don't make it a menu.
  if (isLocationUser) return trigger;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Switch business location</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2" onClick={() => setCurrentShopId(null)}>
          <Building2 className="h-4 w-4" />
          <span className="flex-1">All Locations</span>
          {!currentShopId && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        {shops.map((s) => (
          <DropdownMenuItem key={String(s.id)} className="gap-2" onClick={() => setCurrentShopId(s.id)}>
            <Store className="h-4 w-4" />
            <span className="flex-1 truncate">
              {nameOf(s)}
              <span className="ml-1 text-[10px] uppercase text-muted-foreground">{s.shopType}</span>
            </span>
            {String(currentShopId) === String(s.id) && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
