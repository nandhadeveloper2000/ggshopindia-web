"use client";

import type { MouseEvent } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { extractErrorMessage } from "@/lib/axios";
import { wishlistService } from "@/services/wishlist.service";
import { useAuthStore } from "@/store/auth.store";
import { useAuthModal } from "@/store/authModal.store";
import type { ID } from "@/types/common.types";

interface Props {
  productId: ID;
  className?: string;
  variant?: "secondary" | "outline" | "ghost";
}

/**
 * Reusable add/remove-from-wishlist heart button.
 *
 * Wishlist is customer-scoped and server-backed (React Query `["wishlist", customerId]`).
 * The button reflects whether the product is already saved and toggles on click.
 * It often sits inside a card-level <Link>, so the click is stopped from navigating.
 * Signed-out visitors are prompted to log in (the wishlist API requires a customer).
 */
export function WishlistButton({ productId, className, variant = "secondary" }: Props) {
  const user = useAuthStore((s) => s.user);
  const customerId = user?.id;
  const openAuthModal = useAuthModal((s) => s.openAuthModal);
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["wishlist", customerId],
    queryFn: () => wishlistService.list(customerId!),
    enabled: !!customerId,
    retry: false,
  });

  const wishlisted = items.some((w) => String(w.productId) === String(productId));

  const toggle = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!customerId) {
      openAuthModal("login");
      return;
    }

    try {
      if (wishlisted) {
        await wishlistService.remove(customerId, productId);
        toast.success("Removed from wishlist");
      } else {
        await wishlistService.add(customerId, productId);
        toast.success("Added to wishlist");
      }
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    } catch (err) {
      // A 401 here means the session's token was rejected (e.g. a demo login the
      // backend can't persist a wishlist for). Show a friendly nudge instead of
      // echoing the backend's raw "Authentication required" message.
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      toast.error(
        status === 401
          ? "Please sign in to update your wishlist."
          : extractErrorMessage(err, "Could not update your wishlist."),
      );
    }
  };

  return (
    <Button
      type="button"
      size="icon"
      variant={variant}
      onClick={toggle}
      aria-pressed={wishlisted}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={cn("h-9 w-9", className)}
    >
      <Heart className={cn("h-4 w-4", wishlisted && "fill-red-500 text-red-500")} />
    </Button>
  );
}
