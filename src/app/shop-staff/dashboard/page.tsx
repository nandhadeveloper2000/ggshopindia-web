"use client";

import { useQuery } from "@tanstack/react-query";
import { Boxes, Receipt, ShoppingCart, Users } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ChartCard } from "@/components/common/ChartCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { LowStockTable } from "@/components/dashboard/LowStockTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportsService } from "@/services/reports.service";
import { salesService } from "@/services/sales.service";
import { ordersService } from "@/services/orders.service";
import { shopProductsService } from "@/services/shopProducts.service";
import { customersService } from "@/services/customers.service";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function ShopStaffDashboardPage() {
  const sales = useQuery({ queryKey: ["sales"], queryFn: salesService.list });
  const orders = useQuery({ queryKey: ["orders"], queryFn: ordersService.list });
  const products = useQuery({ queryKey: ["shop-products"], queryFn: () => shopProductsService.list() });
  const customers = useQuery({ queryKey: ["customers"], queryFn: customersService.list });
  const salesChart = useQuery({ queryKey: ["sales-chart"], queryFn: () => reportsService.sales() });

  const salesTotal = (sales.data ?? []).reduce((a, s) => a + s.grandTotal, 0);
  const ordersToday = (orders.data ?? []).length;
  const lowStock = (products.data ?? []).filter((p) => p.lowStockQty !== undefined && p.qty <= (p.lowStockQty ?? 0));

  return (
    <>
      <PageHeader title="Dashboard" description="Your shop activity for today." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today Sales" value={formatCurrency(salesTotal)} icon={Receipt} />
        <StatCard title="Orders" value={formatNumber(ordersToday)} icon={ShoppingCart} />
        <StatCard title="Low Stock" value={formatNumber(lowStock.length)} icon={Boxes} iconClassName="bg-warning/10 text-warning" />
        <StatCard title="Customers" value={formatNumber(customers.data?.length ?? 0)} icon={Users} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Sales Trend">
          <SalesChart data={salesChart.data ?? []} />
        </ChartCard>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low Stock</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <LowStockTable rows={products.data ?? []} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
