"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { getRoleHome } from "@/lib/roles";

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) router.replace(getRoleHome(user.role));
    else router.replace("/login");
  }, [user, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="text-muted-foreground">Loading…</div>
    </div>
  );
}
