"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Package, ShoppingCart, Store, Users, UserCog } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ChartCard } from "@/components/common/ChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { OrderStatusChart } from "@/components/dashboard/OrderStatusChart";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { usersService } from "@/services/users.service";
import { shopOwnersService } from "@/services/shopOwners.service";
import { shopsService } from "@/services/shops.service";
import { productsService } from "@/services/products.service";
import { ordersService } from "@/services/orders.service";
import { reportsService } from "@/services/reports.service";
import { notificationsService } from "@/services/notifications.service";
import { formatNumber } from "@/lib/utils";

export default function SuperAdminDashboardPage() {
  const users = useQuery({ queryKey: ["users"], queryFn: usersService.list });
  const owners = useQuery({ queryKey: ["shop-owners"], queryFn: shopOwnersService.list });
  const shops = useQuery({ queryKey: ["shops"], queryFn: shopsService.list });
  const products = useQuery({ queryKey: ["products"], queryFn: () => productsService.list() });
  const orders = useQuery({ queryKey: ["orders"], queryFn: ordersService.list });
  const sales = useQuery({ queryKey: ["sales-chart"], queryFn: () => reportsService.sales() });
  const status = useQuery({ queryKey: ["order-status"], queryFn: reportsService.orderStatus });
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: notificationsService.list });

  const pendingApprovals = (products.data ?? []).filter((p) => p.approvalStatus === "PENDING");

  return (
    <>
      <PageHeader title="Dashboard" description="Platform overview across all shops and operations." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Users" value={formatNumber(users.data?.length ?? 0)} icon={Users} />
        <StatCard title="Shop Owners" value={formatNumber(owners.data?.length ?? 0)} icon={UserCog} />
        <StatCard title="Shops" value={formatNumber(shops.data?.length ?? 0)} icon={Store} />
        <StatCard title="Products" value={formatNumber(products.data?.length ?? 0)} icon={Package} />
        <StatCard title="Pending Approvals" value={formatNumber(pendingApprovals.length)} icon={CheckSquare} iconClassName="bg-warning/10 text-warning" />
        <StatCard title="Total Orders" value={formatNumber(orders.data?.length ?? 0)} icon={ShoppingCart} />
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
                      {s.shopCode} · {s.businessType.replace(/_/g, " ")}
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
