"use client";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { purchasesService } from "@/services/purchases.service";

export default function PurchaseReturnsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["purchases"], queryFn: purchasesService.list });
  return (
    <>
      <PageHeader title="Purchase Returns" description="Returns on purchase transactions." />
      <DataTable
        data={data}
        loading={isLoading}
        rowKey={(r) => r.id as number}
        columns={[
          { key: "transactionNo", header: "Txn #" },
          { key: "vendorName", header: "Vendor" },
          { key: "transactionDate", header: "Date", render: (r) => formatDate(r.transactionDate) },
          { key: "grandTotal", header: "Total", align: "right", render: (r) => formatCurrency(r.grandTotal) },
          { key: "paymentStatus", header: "Status", render: (r) => <StatusBadge status={r.paymentStatus} /> },
        ]}
      />
    </>
  );
}
