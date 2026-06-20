"use client";

import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingBag, Wallet, BadgeDollarSign } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import { purchasesService } from "@/services/purchases.service";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export default function VendorDashboardPage() {
  const purchases = useQuery({ queryKey: ["purchases"], queryFn: purchasesService.list });

  const totalAmount = (purchases.data ?? []).reduce((a, p) => a + p.grandTotal, 0);
  const totalPaid = (purchases.data ?? []).reduce((a, p) => a + p.paidAmount, 0);
  const balance = totalAmount - totalPaid;

  return (
    <>
      <PageHeader title="Vendor Dashboard" description="Overview of supplied products and payments." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Purchases" value={formatCurrency(totalAmount)} icon={ShoppingBag} />
        <StatCard title="Paid" value={formatCurrency(totalPaid)} icon={Wallet} iconClassName="bg-success/10 text-success" />
        <StatCard title="Balance" value={formatCurrency(balance)} icon={BadgeDollarSign} iconClassName="bg-warning/10 text-warning" />
        <StatCard title="Products Supplied" value={formatNumber((purchases.data ?? []).length)} icon={Package} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Txn #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(purchases.data ?? []).slice(0, 5).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.transactionNo}</TableCell>
                    <TableCell>{formatDate(p.transactionDate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.grandTotal)}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.paymentStatus} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Txn #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(purchases.data ?? []).filter((p) => p.paidAmount > 0).slice(0, 5).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.transactionNo}</TableCell>
                    <TableCell>{formatDate(p.transactionDate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.paidAmount)}</TableCell>
                    <TableCell>{p.paymentMethod}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
