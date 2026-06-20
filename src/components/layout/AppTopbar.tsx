"use client";

import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserMenu } from "./UserMenu";
import { useSidebarStore } from "@/store/sidebar.store";
import { Badge } from "@/components/ui/badge";

interface Props {
  title?: string;
}

export function AppTopbar({ title }: Props) {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
      <Button
        size="icon"
        variant="ghost"
        className="lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {title && <h1 className="text-base font-semibold hidden md:block">{title}</h1>}

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search…" className="h-9 w-64 pl-9" />
        </div>
        <Button size="icon" variant="ghost" className="relative">
          <Bell className="h-5 w-5" />
          <Badge variant="destructive" className="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[10px]">
            3
          </Badge>
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}
