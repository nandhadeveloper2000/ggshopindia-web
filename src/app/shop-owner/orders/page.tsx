"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ordersService } from "@/services/orders.service";
import type { OrderStatus } from "@/types/order.types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const STATUSES: OrderStatus[] = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function OrdersPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["orders"], queryFn: ordersService.list });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["orders"] });

  return (
    <>
      <PageHeader title="Orders" description="Manage all customer orders." />
      <DataTable
        data={data}
        loading={isLoading}
        rowKey={(r) => r.id as number}
        columns={[
          { key: "orderNo", header: "Order #", render: (r) => <span className="font-medium">{r.orderNo}</span> },
          { key: "customerName", header: "Customer" },
          { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
          { key: "paymentMethod", header: "Payment" },
          { key: "paymentStatus", header: "Pay Status", render: (r) => <StatusBadge status={r.paymentStatus} /> },
          { key: "grandTotal", header: "Total", align: "right", render: (r) => formatCurrency(r.grandTotal) },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <Select
                value={r.status}
                onValueChange={async (v) => {
                  await ordersService.updateStatus(r.id, v as OrderStatus);
                  toast.success("Status updated");
                  invalidate();
                }}
              >
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
        ]}
      />
    </>
  );
}
