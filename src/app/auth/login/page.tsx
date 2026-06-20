"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Legacy URL — three branded portals replaced this combined page:
//   /master  → Master Admin
//   /seller  → Shop Owner / Staff / Vendor
//   /login   → Customer
export default function LegacyLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return (
    <div className="flex h-screen w-screen items-center justify-center text-sm text-muted-foreground">
      Redirecting…
    </div>
  );
}
