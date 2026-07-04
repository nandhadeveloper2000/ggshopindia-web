"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { CornerDownLeft, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { NavItem } from "./nav-items";
import { cn } from "@/lib/utils";

interface FlatPage {
  label: string;
  href: string;
  group?: string;
  icon: NavItem["icon"];
}

function flatten(items: NavItem[]): FlatPage[] {
  const out: FlatPage[] = [];
  for (const it of items) {
    if (it.children?.length) {
      for (const c of it.children) {
        if (c.href) out.push({ label: c.label, href: c.href, group: it.label, icon: c.icon });
      }
    } else if (it.href) {
      out.push({ label: it.label, href: it.href, icon: it.icon });
    }
  }
  return out;
}

const RECENT_KEY = "si_recent_pages";
const readRecent = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
};

export function CommandPalette({ items, collapsed }: { items: NavItem[]; collapsed?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const pages = useMemo(() => flatten(items), [items]);

  useEffect(() => {
    if (open) setRecent(readRecent());
  }, [open]);

  // Global shortcut: Ctrl/⌘ + K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    try {
      const next = [href, ...readRecent().filter((h) => h !== href)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setOpen(false);
    router.push(href);
  };

  const recentPages = recent
    .map((h) => pages.find((p) => p.href === h))
    .filter((p): p is FlatPage => Boolean(p));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Open Anything (Ctrl+K)"
        className={cn(
          "flex items-center gap-2 rounded-full border border-white/10 bg-white/5 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white/90",
          collapsed ? "h-9 w-9 justify-center" : "w-full px-3 py-2"
        )}
      >
        <Search className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="truncate">Open Anything</span>
            <kbd className="ml-auto rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/70">Ctrl K</kbd>
          </>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">Open Anything</DialogTitle>
          <Command
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-muted-foreground"
            loop
          >
            <div className="flex items-center gap-2 border-b px-3 pr-10">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Command.Input
                autoFocus
                placeholder="Open anything like invoices, reports…"
                className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Command.List className="max-h-80 overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>

              {recentPages.length > 0 && (
                <Command.Group heading="Recent Pages">
                  {recentPages.map((p) => (
                    <PaletteItem key={`recent-${p.href}`} page={p} value={`recent ${p.label}`} onGo={go} />
                  ))}
                </Command.Group>
              )}

              <Command.Group heading="Suggested Pages">
                {pages.map((p) => (
                  <PaletteItem key={p.href} page={p} value={`${p.label} ${p.group ?? ""}`} onGo={go} />
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PaletteItem({
  page,
  value,
  onGo,
}: {
  page: FlatPage;
  value: string;
  onGo: (href: string) => void;
}) {
  const Icon = page.icon;
  return (
    <Command.Item
      value={value}
      onSelect={() => onGo(page.href)}
      className="group flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{page.label}</span>
      {page.group && <span className="ml-auto text-xs text-muted-foreground">{page.group}</span>}
      <CornerDownLeft className="ml-2 hidden h-3.5 w-3.5 text-muted-foreground group-data-[selected=true]:inline" />
    </Command.Item>
  );
}
