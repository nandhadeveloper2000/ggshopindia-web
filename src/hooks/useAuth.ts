"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { getRoleHome, UserRoleType } from "@/lib/roles";
import { getLoginPortalFor } from "@/lib/portals";

export function useAuth() {
  const { user, isAuthenticated, logout } = useAuthStore();
  return { user, isAuthenticated, logout };
}

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    const onPortal = pathname.startsWith("/auth") || pathname === "/login" || pathname === "/master" || pathname === "/seller";
    if (!isAuthenticated && !onPortal) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, pathname, router]);

  return { user, isAuthenticated };
}

export function useRoleGuard(allowed: UserRoleType[] | string[]) {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace(getLoginPortalFor(allowed[0] as UserRoleType));
      return;
    }
    if (user && !allowed.includes(user.role as UserRoleType)) {
      router.replace(getRoleHome(user.role));
    }
  }, [allowed, hasHydrated, isAuthenticated, router, user]);

  return { user, isAuthenticated };
}
