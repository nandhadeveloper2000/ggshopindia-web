"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/types/order.types";

interface Props {
  rows: Order[];
}

export function RecentOrdersTable({ rows }: Props) {
  const recent = rows.slice(0, 6);
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recent.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                No recent orders
              </TableCell>
            </TableRow>
          ) : (
            recent.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.orderNo}</TableCell>
                <TableCell>{o.customerName ?? "—"}</TableCell>
                <TableCell>{formatDate(o.createdAt)}</TableCell>
                <TableCell className="text-right">{formatCurrency(o.grandTotal)}</TableCell>
                <TableCell>
                  <StatusBadge status={o.status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
