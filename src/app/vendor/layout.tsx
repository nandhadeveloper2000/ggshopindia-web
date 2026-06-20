"use client";

import { ReactNode } from "react";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { vendorNav } from "@/components/layout/nav-items";
import { VENDOR_ROLES } from "@/lib/roles";

export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout nav={vendorNav} allowedRoles={VENDOR_ROLES} title="Vendor Portal">
      {children}
    </RoleLayout>
  );
}
