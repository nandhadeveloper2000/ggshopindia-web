"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CUSTOMER_ROLES, UserRole, getRoleHome } from "@/lib/roles";
import { useAuthStore } from "@/store/auth.store";
import { APP_NAME } from "@/lib/constants";

export default function CustomerLayout({ children }: { children: ReactNode }) {
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
      router.replace(getRoleHome(user.role));
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
