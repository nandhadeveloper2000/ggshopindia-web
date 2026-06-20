"use client";

import { useQuery } from "@tanstack/react-query";
import { Boxes, ClipboardList, Package, Receipt, ShoppingBag, ShoppingCart, Store, Users } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ChartCard } from "@/components/common/ChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { PurchaseChart } from "@/components/dashboard/PurchaseChart";
import { StockValueChart } from "@/components/dashboard/StockValueChart";
import { LowStockTable } from "@/components/dashboard/LowStockTable";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { reportsService } from "@/services/reports.service";
import { shopsService } from "@/services/shops.service";
import { usersService } from "@/services/users.service";
import { vendorsService } from "@/services/vendors.service";
import { productsService } from "@/services/products.service";
import { shopProductsService } from "@/services/shopProducts.service";
import { salesService } from "@/services/sales.service";
import { purchasesService } from "@/services/purchases.service";
import { ordersService } from "@/services/orders.service";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function ShopOwnerDashboardPage() {
  const summary = useQuery({ queryKey: ["report-summary"], queryFn: () => reportsService.summary() });
  const sales = useQuery({ queryKey: ["chart-sales"], queryFn: () => reportsService.sales() });
  const purchases = useQuery({ queryKey: ["chart-purchases"], queryFn: () => reportsService.purchases() });
  const stockValue = useQuery({ queryKey: ["chart-stock"], queryFn: () => reportsService.stockValue() });
  const shops = useQuery({ queryKey: ["shops"], queryFn: shopsService.list });
  const users = useQuery({ queryKey: ["users"], queryFn: usersService.list });
  const vendors = useQuery({ queryKey: ["vendors"], queryFn: vendorsService.list });
  const products = useQuery({ queryKey: ["products"], queryFn: () => productsService.list() });
  const shopProducts = useQuery({ queryKey: ["shop-products"], queryFn: () => shopProductsService.list() });
  const orders = useQuery({ queryKey: ["orders"], queryFn: ordersService.list });
  const todaySales = useQuery({ queryKey: ["sales"], queryFn: salesService.list });
  const todayPurchases = useQuery({ queryKey: ["purchases"], queryFn: purchasesService.list });

  const lowStock = (shopProducts.data ?? []).filter((p) => p.lowStockQty !== undefined && p.qty <= p.lowStockQty!);
  const todaySalesTotal = (todaySales.data ?? []).reduce((a, s) => a + s.grandTotal, 0);
  const todayPurchasesTotal = (todayPurchases.data ?? []).reduce((a, p) => a + p.grandTotal, 0);
  const pendingOrders = (orders.data ?? []).filter((o) => o.status === "PLACED" || o.status === "CONFIRMED").length;

  return (
    <>
      <PageHeader title="Dashboard" description="Your shop performance at a glance." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard title="Shops" value={formatNumber(shops.data?.length ?? 0)} icon={Store} />
        <StatCard title="Staff" value={formatNumber(users.data?.length ?? 0)} icon={Users} />
        <StatCard title="Vendors" value={formatNumber(vendors.data?.length ?? 0)} icon={ShoppingBag} />
        <StatCard title="Products" value={formatNumber(products.data?.length ?? 0)} icon={Package} />
        <StatCard title="Low Stock" value={formatNumber(lowStock.length)} icon={Boxes} iconClassName="bg-warning/10 text-warning" />
        <StatCard title="Today Sales" value={formatCurrency(todaySalesTotal)} icon={Receipt} iconClassName="bg-success/10 text-success" />
        <StatCard title="Today Purchases" value={formatCurrency(todayPurchasesTotal)} icon={ShoppingCart} />
        <StatCard title="Pending Orders" value={formatNumber(pendingOrders)} icon={ClipboardList} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Sales" description="Last 7 months" className="lg:col-span-2">
          <SalesChart data={sales.data ?? []} />
        </ChartCard>
        <ChartCard title="Stock Value">
          <StockValueChart data={stockValue.data ?? []} />
        </ChartCard>
        <ChartCard title="Purchases" className="lg:col-span-3">
          <PurchaseChart data={purchases.data ?? []} />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low Stock</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <LowStockTable rows={shopProducts.data ?? []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <RecentOrdersTable rows={orders.data ?? []} />
          </CardContent>
        </Card>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Stock value: <strong>{formatCurrency(summary.data?.stockValue ?? 0)}</strong> · Net profit:{" "}
        <strong>{formatCurrency(summary.data?.netProfit ?? 0)}</strong>
      </p>
    </>
  );
}
