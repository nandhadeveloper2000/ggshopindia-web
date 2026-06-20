"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Heart, Package2, Search, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "./UserMenu";
import { useCartStore } from "@/store/cart.store";
import { routes } from "@/lib/routes";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TOP_NAV = [
  { label: "Home", href: routes.customer.home },
  { label: "Products", href: routes.customer.products },
  { label: "Orders", href: routes.customer.orders },
  { label: "Wishlist", href: routes.customer.wishlist },
];

export function CustomerHeader() {
  const pathname = usePathname();
  const count = useCartStore((s) => s.items.reduce((a, i) => a + i.qty, 0));

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center gap-4">
        <Link href={routes.customer.home} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Package2 className="h-5 w-5" />
          </div>
          <span className="hidden sm:inline text-sm font-semibold">{APP_NAME}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {TOP_NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products…" className="h-9 w-64 pl-9" />
          </div>
          <Button size="icon" variant="ghost" asChild>
            <Link href={routes.customer.wishlist}>
              <Heart className="h-5 w-5" />
            </Link>
          </Button>
          <Button size="icon" variant="ghost" asChild className="relative">
            <Link href={routes.customer.cart}>
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <Badge variant="destructive" className="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[10px]">
                  {count}
                </Badge>
              )}
            </Link>
          </Button>
          <Button size="icon" variant="ghost" asChild>
            <Link href={routes.customer.notifications}>
              <Bell className="h-5 w-5" />
            </Link>
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
