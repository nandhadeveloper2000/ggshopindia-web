"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { salesService } from "@/services/sales.service";

export default function StaffSalesPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["sales"], queryFn: salesService.list });
  return (
    <>
      <PageHeader title="Sales" description="Sales transactions handled by you." />
      <DataTable
        data={data}
        loading={isLoading}
        rowKey={(r) => r.id as number}
        columns={[
          { key: "transactionNo", header: "Txn #", render: (r) => <span className="font-medium">{r.transactionNo}</span> },
          { key: "invoiceNo", header: "Invoice #" },
          { key: "customerName", header: "Customer" },
          { key: "transactionDate", header: "Date", render: (r) => formatDate(r.transactionDate) },
          { key: "grandTotal", header: "Total", align: "right", render: (r) => formatCurrency(r.grandTotal) },
          { key: "paymentStatus", header: "Status", render: (r) => <StatusBadge status={r.paymentStatus} /> },
        ]}
      />
    </>
  );
}
