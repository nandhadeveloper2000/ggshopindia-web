"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { purchasesService } from "@/services/purchases.service";

export default function PurchasesPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["purchases"], queryFn: purchasesService.list });

  return (
    <>
      <PageHeader
        title="Purchases"
        description="All purchase transactions from your vendors."
        actions={
          <Button className="gap-2" onClick={() => toast.info("Purchase entry form opens here")}>
            <Plus className="h-4 w-4" /> New Purchase
          </Button>
        }
      />
      <DataTable
        data={data}
        loading={isLoading}
        rowKey={(r) => r.id as number}
        columns={[
          { key: "transactionNo", header: "Txn #", render: (r) => <span className="font-medium">{r.transactionNo}</span> },
          { key: "vendorName", header: "Vendor" },
          { key: "vendorInvoiceNo", header: "Invoice #" },
          { key: "transactionDate", header: "Date", render: (r) => formatDate(r.transactionDate) },
          { key: "grandTotal", header: "Total", align: "right", render: (r) => formatCurrency(r.grandTotal) },
          { key: "paidAmount", header: "Paid", align: "right", render: (r) => formatCurrency(r.paidAmount) },
          { key: "paymentMethod", header: "Method" },
          { key: "paymentStatus", header: "Status", render: (r) => <StatusBadge status={r.paymentStatus} /> },
        ]}
      />
    </>
  );
}
