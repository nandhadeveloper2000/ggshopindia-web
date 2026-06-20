"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { purchasesService } from "@/services/purchases.service";

export default function VendorPaymentsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["purchases"], queryFn: purchasesService.list });

  return (
    <>
      <PageHeader title="Payments" description="Payments received and outstanding." />
      <DataTable
        data={data}
        loading={isLoading}
        rowKey={(r) => r.id as number}
        columns={[
          { key: "transactionNo", header: "Reference" },
          { key: "transactionDate", header: "Date", render: (r) => formatDate(r.transactionDate) },
          { key: "grandTotal", header: "Invoice", align: "right", render: (r) => formatCurrency(r.grandTotal) },
          { key: "paidAmount", header: "Paid", align: "right", render: (r) => formatCurrency(r.paidAmount) },
          { key: "balance", header: "Balance", align: "right", render: (r) => formatCurrency(r.grandTotal - r.paidAmount) },
          { key: "paymentMethod", header: "Method" },
          {
            key: "paymentStatus",
            header: "Status",
            render: (r) => <Badge variant={r.paymentStatus === "PAID" ? "success" : r.paymentStatus === "PARTIAL" ? "warning" : "destructive"}>{r.paymentStatus}</Badge>,
          },
        ]}
      />
    </>
  );
}
