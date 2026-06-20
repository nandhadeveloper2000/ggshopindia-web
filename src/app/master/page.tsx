"use client";

import { Shield } from "lucide-react";
import { PortalLogin } from "@/components/auth/PortalLogin";
import { SUPER_ADMIN_ROLES } from "@/lib/roles";
import { routes } from "@/lib/routes";

export default function MasterAdminLoginPage() {
  return (
    <PortalLogin
      portalTitle="Master Admin Portal"
      portalSubtitle="Platform-wide control over shops, users, catalog, and approvals."
      badge="Master Admin"
      icon={<Shield className="h-5 w-5" />}
      allowedRoles={SUPER_ADMIN_ROLES}
      identifierLabel="Admin email or username"
      identifierPlaceholder="admin@company.com"
      fallbackRedirect={routes.superAdmin.dashboard}
    />
  );
}
