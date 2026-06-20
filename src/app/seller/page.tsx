"use client";

import { Store } from "lucide-react";
import { PortalLogin } from "@/components/auth/PortalLogin";
import { SHOP_OWNER_ROLES, SHOP_STAFF_ROLES, VENDOR_ROLES } from "@/lib/roles";
import { routes } from "@/lib/routes";

export default function SellerLoginPage() {
  return (
    <PortalLogin
      portalTitle="Seller Portal"
      portalSubtitle="Sign in to manage your shops, staff, inventory, sales, purchases, and vendors."
      badge="Shop / Vendor"
      icon={<Store className="h-5 w-5" />}
      allowedRoles={[...SHOP_OWNER_ROLES, ...SHOP_STAFF_ROLES, ...VENDOR_ROLES]}
      identifierLabel="Email, mobile, or username"
      identifierPlaceholder="owner@yourshop.com"
      fallbackRedirect={routes.shopOwner.dashboard}
    />
  );
}
