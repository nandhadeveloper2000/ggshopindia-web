"use client";

import { ShieldCheck, ShoppingBag } from "lucide-react";
import { CustomerAuthForm } from "@/components/auth/CustomerAuthForm";
import { APP_NAME } from "@/lib/constants";

/**
 * Full-page customer login at `/login` — the split-screen brand panel plus the
 * shared {@link CustomerAuthForm}. The same form also powers the AuthModal popup.
 */
export function CustomerAuthPanel() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/20">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold leading-tight">{APP_NAME}</span>
            <span className="text-xs text-primary-foreground/70">Customer</span>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">Welcome back, shopper</h2>
          <p className="max-w-md text-sm text-primary-foreground/80">
            Sign in to track orders, manage your wishlist, and continue shopping.
          </p>
          <ul className="space-y-2 pt-2 text-sm text-primary-foreground/80">
            {[
              "Fast, passwordless login with OTP",
              "Track every order in one place",
              "Save your wishlist across devices",
            ].map((line) => (
              <li key={line} className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} {APP_NAME}.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background p-6 lg:p-10">
        <div className="w-full max-w-md">
          <CustomerAuthForm />
        </div>
      </div>
    </div>
  );
}
