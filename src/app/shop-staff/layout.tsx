"use client";

import { ReactNode } from "react";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { shopStaffNav } from "@/components/layout/nav-items";
import { SHOP_STAFF_ROLES } from "@/lib/roles";

export default function ShopStaffLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout nav={shopStaffNav} allowedRoles={SHOP_STAFF_ROLES} title="Shop Staff">
      {children}
    </RoleLayout>
  );
}
