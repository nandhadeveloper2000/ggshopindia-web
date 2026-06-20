import { ReactNode } from "react";
import { Package2 } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/20">
            <Package2 className="h-5 w-5" />
          </div>
          <span className="text-base font-semibold">{APP_NAME}</span>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">
            One platform.<br />
            All your shops, inventory, and orders.
          </h2>
          <p className="text-sm text-primary-foreground/80 max-w-md">
            A unified enterprise system for shop owners, staff, vendors, and customers — built for speed, security, and scale.
          </p>
          <ul className="text-sm text-primary-foreground/80 space-y-1.5 mt-6">
            <li>• Multi-shop management with role-based access</li>
            <li>• POS, sales, purchases, stock transfers</li>
            <li>• Customer storefront with cart and checkout</li>
            <li>• Vendor portal for purchase orders and payments</li>
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/70">© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-10 bg-background">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
