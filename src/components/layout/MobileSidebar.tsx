"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package2 } from "lucide-react";
import type { NavItem } from "./nav-items";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSidebarStore } from "@/store/sidebar.store";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

interface Props {
  items: NavItem[];
}

export function MobileSidebar({ items }: Props) {
  const pathname = usePathname();
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Package2 className="h-5 w-5" />
            </div>
            {APP_NAME}
          </SheetTitle>
        </SheetHeader>
        <nav className="p-2">
          <ul className="space-y-0.5">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
