"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { MobileSidebar } from "./MobileSidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import type { NavItem } from "./nav-items";
import { useAuthStore } from "@/store/auth.store";
import { getRoleHome, UserRoleType } from "@/lib/roles";
import { getLoginPortalFor } from "@/lib/portals";

interface Props {
  nav: NavItem[];
  allowedRoles: UserRoleType[] | string[];
  title?: string;
  children: ReactNode;
}

export function RoleLayout({ nav, allowedRoles, title, children }: Props) {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace(getLoginPortalFor(allowedRoles[0] as UserRoleType));
      return;
    }
    if (user && !allowedRoles.includes(user.role as UserRoleType)) {
      router.replace(getRoleHome(user.role));
      return;
    }
    setReady(true);
  }, [hasHydrated, isAuthenticated, user, allowedRoles, router]);

  if (!ready) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <AppSidebar items={nav} />
      <MobileSidebar items={nav} />
      <div className="flex flex-1 flex-col min-w-0">
        <AppTopbar title={title} />
        <main className="flex-1 px-4 py-4 lg:px-6 lg:py-6">
          <div className="mb-3">
            <Breadcrumbs />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
