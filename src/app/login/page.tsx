"use client";

import { ShoppingBag } from "lucide-react";
import { PortalLogin } from "@/components/auth/PortalLogin";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { routes } from "@/lib/routes";

export default function CustomerLoginPage() {
  return (
    <PortalLogin
      portalTitle="Welcome back, shopper"
      portalSubtitle="Sign in to track orders, manage your wishlist, and continue shopping."
      badge="Customer"
      icon={<ShoppingBag className="h-5 w-5" />}
      allowedRoles={CUSTOMER_ROLES}
      identifierLabel="Email or mobile"
      identifierPlaceholder="you@example.com"
      fallbackRedirect={routes.customer.home}
    />
  );
}
