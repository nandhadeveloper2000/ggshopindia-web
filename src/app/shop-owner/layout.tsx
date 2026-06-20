"use client";

import { ReactNode } from "react";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { shopOwnerNav } from "@/components/layout/nav-items";
import { SHOP_OWNER_ROLES } from "@/lib/roles";

export default function ShopOwnerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout nav={shopOwnerNav} allowedRoles={SHOP_OWNER_ROLES} title="Shop Owner">
      {children}
    </RoleLayout>
  );
}
