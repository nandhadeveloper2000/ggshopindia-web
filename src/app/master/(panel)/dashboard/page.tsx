"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckSquare,
  Globe,
  Package,
  Store,
  UserCheck,
  UserCog,
  UserX,
  Warehouse,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ChartCard } from "@/components/common/ChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { OrderStatusChart } from "@/components/dashboard/OrderStatusChart";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { shopOwnersService } from "@/services/shopOwners.service";
import { shopsService } from "@/services/shops.service";
import { productsService } from "@/services/products.service";
import { ordersService } from "@/services/orders.service";
import { reportsService } from "@/services/reports.service";
import { notificationsService } from "@/services/notifications.service";
import { formatNumber } from "@/lib/utils";

export default function SuperAdminDashboardPage() {
  const owners = useQuery({ queryKey: ["shop-owners"], queryFn: shopOwnersService.list });
  const shops = useQuery({ queryKey: ["shops"], queryFn: shopsService.list });
  const products = useQuery({ queryKey: ["products"], queryFn: () => productsService.list() });
  const orders = useQuery({ queryKey: ["orders"], queryFn: ordersService.list });
  const sales = useQuery({ queryKey: ["sales-chart"], queryFn: () => reportsService.sales() });
  const status = useQuery({ queryKey: ["order-status"], queryFn: reportsService.orderStatus });
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: notificationsService.list });

  const ownersList = owners.data ?? [];
  const shopsList = shops.data ?? [];
  const productsList = products.data ?? [];
  const pendingApprovals = productsList.filter((p) => p.approvalStatus === "PENDING");

  // Each shop's mode is inherited from its owner's Shop Control setting.
  const controlByOwner = new Map(ownersList.map((o) => [String(o.id), o.shopControl]));
  const inventoryOnlyShops = shopsList.filter(
    (s) => controlByOwner.get(String(s.shopOwnerId)) === "INVENTORY_ONLY"
  ).length;
  const ecommerceShops = shopsList.filter(
    (s) => controlByOwner.get(String(s.shopOwnerId)) === "INVENTORY_AND_ECOMMERCE"
  ).length;
  const activeOwners = ownersList.filter((o) => o.isActive).length;
  const inactiveOwners = ownersList.filter((o) => !o.isActive).length;

  return (
    <>
      <PageHeader title="Dashboard" description="Platform overview across all shops and operations." />

      <div className="space-y-5">
        {/* Shop Owners */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Shop Owners
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Shop Owners" value={formatNumber(ownersList.length)} icon={UserCog} />
            <StatCard
              title="Active Owners"
              value={formatNumber(activeOwners)}
              icon={UserCheck}
              iconClassName="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              title="Inactive Owners"
              value={formatNumber(inactiveOwners)}
              icon={UserX}
              iconClassName="bg-muted text-muted-foreground"
            />
          </div>
        </section>

        {/* Shops */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Shops
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Total Shops" value={formatNumber(shopsList.length)} icon={Store} />
            <StatCard title="Inventory Only" value={formatNumber(inventoryOnlyShops)} icon={Warehouse} />
            <StatCard
              title="Inventory + Ecommerce"
              value={formatNumber(ecommerceShops)}
              icon={Globe}
            />
          </div>
        </section>

        {/* Products */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Products
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Total Products" value={formatNumber(productsList.length)} icon={Package} />
            <StatCard
              title="Pending Approvals"
              value={formatNumber(pendingApprovals.length)}
              icon={CheckSquare}
              iconClassName="bg-warning/10 text-warning"
            />
          </div>
        </section>
      </div>

      <div className="grid gap-4 mt-4 lg:grid-cols-3">
        <ChartCard title="Shop Growth" description="Monthly shop onboarding" className="lg:col-span-2">
          <SalesChart data={sales.data ?? []} />
        </ChartCard>
        <ChartCard title="Order Status" description="Across the platform">
          <OrderStatusChart data={status.data ?? []} />
        </ChartCard>
      </div>

      <div className="grid gap-4 mt-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Shops</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y">
              {(shops.data ?? []).slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{s.shopName}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.shopCode} · {(s.businessType ?? "").replace(/_/g, " ")}
                    </p>
                  </div>
                  <StatusBadge status={s.isActive} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Product Approvals</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y">
              {pendingApprovals.length === 0 ? (
                <li className="py-4 text-center text-sm text-muted-foreground">No pending approvals</li>
              ) : (
                pendingApprovals.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{p.itemName}</p>
                      <p className="text-xs text-muted-foreground">{p.sku} · {p.brandName ?? "—"}</p>
                    </div>
                    <Badge variant="warning">PENDING</Badge>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 mt-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <RecentOrdersTable rows={orders.data ?? []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y">
              {(notifications.data ?? []).slice(0, 5).map((n) => (
                <li key={n.id} className="py-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
