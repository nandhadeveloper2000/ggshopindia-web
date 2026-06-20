"use client";
import { useQuery } from "@tanstack/react-query";
import { ReportsPage } from "@/components/common/ReportsPage";
import { ChartCard } from "@/components/common/ChartCard";
import { StatCard } from "@/components/common/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { PurchaseChart } from "@/components/dashboard/PurchaseChart";
import { OrderStatusChart } from "@/components/dashboard/OrderStatusChart";
import { LowStockTable } from "@/components/dashboard/LowStockTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportsService } from "@/services/reports.service";
import { shopProductsService } from "@/services/shopProducts.service";
import { shopsService } from "@/services/shops.service";
import { formatCurrency } from "@/lib/utils";
import { Boxes, ShoppingCart, TrendingUp, Wallet } from "lucide-react";

export default function ShopOwnerReportsPage() {
  const summary = useQuery({ queryKey: ["report-summary"], queryFn: () => reportsService.summary() });
  const sales = useQuery({ queryKey: ["report-sales"], queryFn: () => reportsService.sales() });
  const purchases = useQuery({ queryKey: ["report-purchases"], queryFn: () => reportsService.purchases() });
  const status = useQuery({ queryKey: ["report-status"], queryFn: () => reportsService.orderStatus() });
  const shopProducts = useQuery({ queryKey: ["shop-products"], queryFn: () => shopProductsService.list() });
  const shops = useQuery({ queryKey: ["shops"], queryFn: shopsService.list });

  return (
    <ReportsPage
      title="Reports"
      description="Low stock, stock value, sales, purchases, expenses and customer orders"
      shops={(shops.data ?? []).map((s) => ({ label: s.shopName, value: String(s.id) }))}
      statuses={[
        { label: "All", value: "" },
        { label: "Paid", value: "PAID" },
        { label: "Partial", value: "PARTIAL" },
        { label: "Pending", value: "PENDING" },
      ]}
      onApply={() => undefined}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Sales" value={formatCurrency(summary.data?.totalSales ?? 0)} icon={TrendingUp} />
        <StatCard title="Purchases" value={formatCurrency(summary.data?.totalPurchases ?? 0)} icon={ShoppingCart} />
        <StatCard title="Stock Value" value={formatCurrency(summary.data?.stockValue ?? 0)} icon={Boxes} />
        <StatCard title="Net Profit" value={formatCurrency(summary.data?.netProfit ?? 0)} icon={Wallet} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Sales" className="lg:col-span-2">
          <SalesChart data={sales.data ?? []} />
        </ChartCard>
        <ChartCard title="Order Status">
          <OrderStatusChart data={status.data ?? []} />
        </ChartCard>
        <ChartCard title="Purchases" className="lg:col-span-2">
          <PurchaseChart data={purchases.data ?? []} />
        </ChartCard>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low Stock</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <LowStockTable rows={shopProducts.data ?? []} />
          </CardContent>
        </Card>
      </div>
    </ReportsPage>
  );
}
