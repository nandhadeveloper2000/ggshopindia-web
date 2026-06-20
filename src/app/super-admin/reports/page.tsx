"use client";

import { useQuery } from "@tanstack/react-query";
import { ReportsPage } from "@/components/common/ReportsPage";
import { ChartCard } from "@/components/common/ChartCard";
import { StatCard } from "@/components/common/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { PurchaseChart } from "@/components/dashboard/PurchaseChart";
import { OrderStatusChart } from "@/components/dashboard/OrderStatusChart";
import { reportsService } from "@/services/reports.service";
import { formatCurrency } from "@/lib/utils";
import { Package, ShoppingCart, TrendingUp, Wallet } from "lucide-react";

export default function SuperAdminReportsPage() {
  const summary = useQuery({ queryKey: ["report-summary"], queryFn: () => reportsService.summary() });
  const sales = useQuery({ queryKey: ["report-sales"], queryFn: () => reportsService.sales() });
  const purchases = useQuery({ queryKey: ["report-purchases"], queryFn: () => reportsService.purchases() });
  const status = useQuery({ queryKey: ["report-status"], queryFn: () => reportsService.orderStatus() });

  return (
    <ReportsPage title="Platform Reports" description="High-level analytics across all shops" onApply={() => undefined}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Sales" value={formatCurrency(summary.data?.totalSales ?? 0)} icon={TrendingUp} />
        <StatCard title="Total Purchases" value={formatCurrency(summary.data?.totalPurchases ?? 0)} icon={ShoppingCart} />
        <StatCard title="Stock Value" value={formatCurrency(summary.data?.stockValue ?? 0)} icon={Package} />
        <StatCard title="Net Profit" value={formatCurrency(summary.data?.netProfit ?? 0)} icon={Wallet} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Sales" className="lg:col-span-2">
          <SalesChart data={sales.data ?? []} />
        </ChartCard>
        <ChartCard title="Order Status">
          <OrderStatusChart data={status.data ?? []} />
        </ChartCard>
        <ChartCard title="Purchases" className="lg:col-span-3">
          <PurchaseChart data={purchases.data ?? []} />
        </ChartCard>
      </div>
    </ReportsPage>
  );
}
