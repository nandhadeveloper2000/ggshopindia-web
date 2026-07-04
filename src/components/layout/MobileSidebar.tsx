"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, Package2 } from "lucide-react";
import type { NavItem } from "./nav-items";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSidebarStore } from "@/store/sidebar.store";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

interface Props {
  items: NavItem[];
  topSlot?: ReactNode;
}

function isActive(pathname: string, href?: string) {
  if (!href) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileSidebar({ items, topSlot }: Props) {
  const pathname = usePathname();
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const close = () => setMobileOpen(false);

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-72 border-white/10 bg-[#131426] p-0 text-white/70">
        <SheetHeader className="border-b border-white/10 p-4">
          <SheetTitle className="flex items-center gap-2 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Package2 className="h-5 w-5" />
            </div>
            {APP_NAME}
          </SheetTitle>
        </SheetHeader>
        {topSlot && <div className="border-b border-white/10 px-2 py-2">{topSlot}</div>}
        <nav className="p-2">
          <ul className="space-y-0.5">
            {items.map((item) =>
              item.children?.length ? (
                <MobileGroup key={item.label} item={item} pathname={pathname} onNavigate={close} />
              ) : (
                <MobileLeaf key={item.href ?? item.label} item={item} pathname={pathname} onNavigate={close} />
              )
            )}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function MobileLeaf({
  item,
  pathname,
  onNavigate,
  nested,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
  nested?: boolean;
}) {
  const Icon = item.icon;
  const active = isActive(pathname, item.href);
  return (
    <li>
      <Link
        href={item.href ?? "#"}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
          active ? "bg-primary text-primary-foreground" : "text-white/70 hover:bg-white/10 hover:text-white",
          nested && "pl-9"
        )}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </Link>
    </li>
  );
}

function MobileGroup({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const children = item.children ?? [];
  const childActive = children.some((c) => isActive(pathname, c.href));
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  const Icon = item.icon;
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm",
          childActive ? "bg-white/5 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="mt-0.5 space-y-0.5">
          {children.map((c) => (
            <MobileLeaf key={c.href ?? c.label} item={c} pathname={pathname} onNavigate={onNavigate} nested />
          ))}
        </ul>
      )}
    </li>
  );
}
