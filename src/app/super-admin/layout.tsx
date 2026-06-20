"use client";

import { ReactNode } from "react";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { superAdminNav } from "@/components/layout/nav-items";
import { SUPER_ADMIN_ROLES } from "@/lib/roles";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout nav={superAdminNav} allowedRoles={SUPER_ADMIN_ROLES} title="Super Admin">
      {children}
    </RoleLayout>
  );
}
