"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { purchasesService } from "@/services/purchases.service";

export default function VendorPurchaseOrdersPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["purchases"], queryFn: purchasesService.list });
  return (
    <>
      <PageHeader title="Purchase Orders" description="POs raised by shops against your supplies." />
      <DataTable
        data={data}
        loading={isLoading}
        rowKey={(r) => r.id as number}
        columns={[
          { key: "transactionNo", header: "PO #", render: (r) => <span className="font-medium">{r.transactionNo}</span> },
          { key: "vendorInvoiceNo", header: "Invoice #" },
          { key: "transactionDate", header: "Date", render: (r) => formatDate(r.transactionDate) },
          { key: "grandTotal", header: "Total", align: "right", render: (r) => formatCurrency(r.grandTotal) },
          { key: "paidAmount", header: "Paid", align: "right", render: (r) => formatCurrency(r.paidAmount) },
          { key: "paymentStatus", header: "Status", render: (r) => <StatusBadge status={r.paymentStatus} /> },
        ]}
      />
    </>
  );
}
