"use client";

import { ReactNode } from "react";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { BusinessLocationSwitcher } from "@/components/layout/BusinessLocationSwitcher";
import { shopOwnerNav } from "@/components/layout/nav-items";
import { SHOP_OWNER_ROLES, SHOP_STAFF_ROLES } from "@/lib/roles";

// Shop Owners see all their locations; Business Location logins (SHOP_MANAGER and
// staff) reach the same portal but are scoped to their one shop.
const SELLER_ROLES = [...SHOP_OWNER_ROLES, ...SHOP_STAFF_ROLES];

export default function ShopOwnerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout
      nav={shopOwnerNav}
      allowedRoles={SELLER_ROLES}
      title="Seller"
      sidebarTop={<BusinessLocationSwitcher />}
    >
      {children}
    </RoleLayout>
  );
}
