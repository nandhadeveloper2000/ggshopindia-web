"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Heart, MapPin, ShoppingCart, Store, User } from "lucide-react";
import { LocationModal } from "@/components/storefront/LocationModal";
import { SearchAutocomplete } from "@/components/storefront/SearchAutocomplete";
import { useCartStore } from "@/store/cart.store";
import { useLocationStore } from "@/store/location.store";
import { useAuthStore } from "@/store/auth.store";
import { useAuthModal } from "@/store/authModal.store";
import { routes } from "@/lib/routes";
import { getRoleHome, UserRole } from "@/lib/roles";
import { APP_NAME } from "@/lib/constants";

/**
 * PUBLIC storefront header — Reliance Digital-style red bar: logo, a large
 * search field, a location selector, and Cart / Wishlist / Login (or My Account)
 * actions. Renders with or without a logged-in session (safe on the homepage).
 */
export function PublicHeader() {
  const count = useCartStore((s) => s.items.reduce((a, i) => a + i.qty, 0));
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthModal((s) => s.openAuthModal);
  const pincode = useLocationStore((s) => s.pincode);
  const place = useLocationStore((s) => s.place);
  const [locOpen, setLocOpen] = useState(false);
  // Avoid an SSR/client mismatch: the persisted location is only known on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const locationLabel = mounted && pincode ? `${pincode}${place ? ` - ${place}` : ""}` : "Select Location";

  const action =
    "flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-80";

  return (
    <>
    <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-sm">
      <div className="container flex h-16 items-center gap-3 lg:gap-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-primary">
            <Store className="h-5 w-5" />
          </div>
          <span className="hidden text-base font-bold leading-tight sm:inline">{APP_NAME}</span>
        </Link>

        {/* Search (large, white) with live autocomplete */}
        <SearchAutocomplete />

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-4 sm:gap-6">
          {/* Location */}
          <button type="button" onClick={() => setLocOpen(true)} className={`${action} hidden lg:flex`}>
            <MapPin className="h-5 w-5" />
            <span className="max-w-[160px] truncate">{locationLabel}</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {/* Cart */}
          <Link href={routes.customer.cart} className={`relative ${action}`}>
            <span className="relative">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-primary">
                  {count}
                </span>
              )}
            </span>
            <span className="hidden sm:inline">Cart</span>
          </Link>

          {/* Wishlist */}
          <Link href={routes.customer.wishlist} className={action}>
            <Heart className="h-5 w-5" />
            <span className="hidden sm:inline">Wishlist</span>
          </Link>

          {/* Login / Account */}
          {user ? (
            <Link
              href={user.role === UserRole.CUSTOMER ? routes.customer.profile : getRoleHome(user.role)}
              className={action}
            >
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">My Account</span>
            </Link>
          ) : (
            <button type="button" onClick={() => openAuthModal("login")} className={action}>
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
    <LocationModal open={locOpen} onOpenChange={setLocOpen} />
    </>
  );
}
