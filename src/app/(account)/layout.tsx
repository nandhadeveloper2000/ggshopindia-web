"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CUSTOMER_ROLES, UserRole } from "@/lib/roles";
import { useAuthStore } from "@/store/auth.store";
import { APP_NAME } from "@/lib/constants";

/**
 * Layout for the signed-in shopper area — the top-level `/wishlist`, `/cart`,
 * `/checkout` pages and everything under `/account/*`. This route group `(account)`
 * adds no URL segment; it only wraps these pages with the customer header/footer
 * and the client-side auth guard (redirects guests to /login, non-customers to
 * /unauthorized). Public browsing (`/`, `/products`, `/{slug}/p/{id}`, `/category`)
 * lives outside this group and needs no login.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user && !CUSTOMER_ROLES.includes(user.role as typeof UserRole.CUSTOMER)) {
      router.replace("/unauthorized");
      return;
    }
    setReady(true);
  }, [hasHydrated, isAuthenticated, user, router]);

  if (!ready) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <CustomerHeader />
      <main className="flex-1 container py-6">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
