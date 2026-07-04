"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useAuthModal } from "@/store/authModal.store";
import { routes } from "@/lib/routes";
import type { CartItem } from "@/types/cart.types";

/**
 * Login-gated cart actions (Amazon/Flipkart style): a customer must be signed in
 * to add to cart or buy now. When signed out, we open the login popup.
 *
 * Returns:
 *  - addToCart(item, opts?): adds + toasts; returns false (and opens login) if signed out.
 *  - buyNow(item): adds then navigates to checkout; opens login if signed out.
 */
export function useAddToCart() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const openAuthModal = useAuthModal((s) => s.openAuthModal);

  const requireLogin = () => {
    if (!user) {
      openAuthModal("login");
      return false;
    }
    return true;
  };

  const addToCart = (item: CartItem, opts?: { silent?: boolean }) => {
    if (!requireLogin()) return false;
    addItem(item);
    if (!opts?.silent) toast.success("Added to cart");
    return true;
  };

  const buyNow = (item: CartItem) => {
    if (!requireLogin()) return false;
    addItem(item);
    router.push(routes.customer.checkout);
    return true;
  };

  return { addToCart, buyNow, isLoggedIn: !!user };
}
