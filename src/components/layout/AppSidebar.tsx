"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Package2 } from "lucide-react";
import type { NavItem } from "./nav-items";
import { CommandPalette } from "./CommandPalette";
import { useSidebarStore } from "@/store/sidebar.store";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

interface Props {
  items: NavItem[];
  /** Optional content rendered at the top of the sidebar (e.g. a location switcher). */
  topSlot?: ReactNode;
}

function isActive(pathname: string, href?: string) {
  if (!href) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppSidebar({ items, topSlot }: Props) {
  const pathname = usePathname();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggleSidebar = useSidebarStore((s) => s.toggle);

  return (
    <aside
      className={cn(
        "group hidden lg:flex sticky top-0 h-screen flex-col border-r border-white/10 bg-[#131426] text-white/70 transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Collapse / expand arrow — floats on the right edge like the reference.
          Revealed on hover when expanded; always visible when collapsed so the
          rail can be reopened. Kept out of the search row so the pill stays full width. */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand" : "Collapse"}
        className={cn(
          "absolute -right-3 top-[74px] z-30 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-[#131426] text-white/70 shadow-md transition-all hover:border-white/40 hover:text-white",
          collapsed ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Package2 className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight text-white">{APP_NAME}</span>
            <span className="text-[10px] text-white/50">Enterprise Suite</span>
          </div>
        )}
      </div>

      <div className="border-b border-white/10 px-2 py-2">
        <CommandPalette items={items} collapsed={collapsed} />
      </div>

      {topSlot && <div className="border-b border-white/10 px-2 py-2">{topSlot}</div>}

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
        <ul className="space-y-0.5 px-2">
          {items.map((item) =>
            item.children?.length ? (
              <NavGroup key={item.label} item={item} pathname={pathname} collapsed={collapsed} />
            ) : (
              <NavLeaf key={item.href ?? item.label} item={item} pathname={pathname} collapsed={collapsed} />
            )
          )}
        </ul>
      </nav>
    </aside>
  );
}

function NavLeaf({
  item,
  pathname,
  collapsed,
  nested,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  nested?: boolean;
}) {
  const Icon = item.icon;
  const active = isActive(pathname, item.href);
  return (
    <li>
      <Link
        href={item.href ?? "#"}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-white/70 hover:bg-white/10 hover:text-white",
          collapsed && "justify-center px-2",
          nested && !collapsed && "pl-9"
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    </li>
  );
}

function NavGroup({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const children = item.children ?? [];
  const childActive = children.some((c) => isActive(pathname, c.href));
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  // Collapsed rail: no room for a fly-out, so surface the children as icons.
  if (collapsed) {
    return (
      <>
        {children.map((c) => (
          <NavLeaf key={c.href ?? c.label} item={c} pathname={pathname} collapsed />
        ))}
      </>
    );
  }

  const Icon = item.icon;
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          childActive ? "bg-white/5 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate text-left">{item.label}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="mt-0.5 space-y-0.5">
          {children.map((c) => (
            <NavLeaf key={c.href ?? c.label} item={c} pathname={pathname} collapsed={false} nested />
          ))}
        </ul>
      )}
    </li>
  );
}
