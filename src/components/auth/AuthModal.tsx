"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CustomerAuthForm } from "@/components/auth/CustomerAuthForm";
import { useAuthModal } from "@/store/authModal.store";
import { APP_NAME } from "@/lib/constants";
import { routes } from "@/lib/routes";

/**
 * Global Flipkart-style login/signup popup. Opened from anywhere via
 * `useAuthModal().openAuthModal()` (e.g. the storefront header's Login button),
 * it overlays the current page instead of navigating to `/login`. On success it
 * closes and sends the shopper to their home screen.
 */
export function AuthModal() {
  const router = useRouter();
  const { open, mode, closeAuthModal } = useAuthModal();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeAuthModal()}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Login or sign up</DialogTitle>
        <DialogDescription className="sr-only">
          Sign in or create a {APP_NAME} account with your mobile number and a one-time password.
        </DialogDescription>
        <div className="grid sm:grid-cols-[0.85fr_1fr]">
          {/* Brand / value panel (desktop only) */}
          <div className="hidden flex-col justify-between bg-primary p-8 text-primary-foreground sm:flex">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/20">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <span className="text-base font-semibold">{APP_NAME}</span>
              </div>
              <h2 className="mt-8 text-2xl font-semibold leading-tight">Login or Sign up</h2>
              <p className="mt-3 text-sm text-primary-foreground/80">
                Get access to your orders, wishlist, and recommendations.
              </p>
            </div>
            <div className="mt-10 flex h-28 items-center justify-center rounded-lg bg-white/10">
              <ShoppingBag className="h-14 w-14 text-primary-foreground/70" />
            </div>
          </div>

          {/* Form panel */}
          <div className="p-6 sm:p-8">
            <CustomerAuthForm
              initialMode={mode}
              onSuccess={() => {
                closeAuthModal();
                router.replace(routes.customer.home);
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
