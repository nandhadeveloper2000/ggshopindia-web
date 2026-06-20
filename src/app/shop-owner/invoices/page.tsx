"use client";

import { useQuery } from "@tanstack/react-query";
import { Printer, Download } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { invoicesService } from "@/services/invoices.service";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function InvoicesPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["invoices"], queryFn: invoicesService.list });

  return (
    <>
      <PageHeader title="Invoices" description="View and download all generated invoices." />
      <DataTable
        data={data}
        loading={isLoading}
        rowKey={(r) => r.id as number}
        columns={[
          { key: "invoiceNo", header: "Invoice #", render: (r) => <span className="font-medium">{r.invoiceNo}</span> },
          { key: "customerName", header: "Customer" },
          { key: "shopName", header: "Shop" },
          { key: "invoiceDate", header: "Date", render: (r) => formatDate(r.invoiceDate) },
          { key: "grandTotal", header: "Total", align: "right", render: (r) => formatCurrency(r.grandTotal) },
          { key: "paymentStatus", header: "Status", render: (r) => <StatusBadge status={r.paymentStatus} /> },
        ]}
        rowActions={() => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
    </>
  );
}
