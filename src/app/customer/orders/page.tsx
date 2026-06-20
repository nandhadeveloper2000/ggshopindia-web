"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { ordersService } from "@/services/orders.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { routes } from "@/lib/routes";

export default function CustomerOrdersPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["orders"], queryFn: ordersService.list });

  return (
    <>
      <PageHeader title="My Orders" description="All your orders in one place." />
      <DataTable
        data={data}
        loading={isLoading}
        rowKey={(r) => r.id as number}
        columns={[
          { key: "orderNo", header: "Order #", render: (r) => <span className="font-medium">{r.orderNo}</span> },
          { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
          { key: "grandTotal", header: "Total", align: "right", render: (r) => formatCurrency(r.grandTotal) },
          { key: "paymentStatus", header: "Payment", render: (r) => <StatusBadge status={r.paymentStatus} /> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
        rowActions={(r) => (
          <Button size="sm" variant="outline" asChild className="gap-1">
            <Link href={routes.customer.orderDetails(r.id)}>
              <Eye className="h-3.5 w-3.5" /> View
            </Link>
          </Button>
        )}
      />
    </>
  );
}
