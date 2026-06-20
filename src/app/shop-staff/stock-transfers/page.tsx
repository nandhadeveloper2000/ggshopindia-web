"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/utils";
import { stockTransfersService } from "@/services/stockTransfers.service";

export default function StaffStockTransfersPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["transfers"], queryFn: stockTransfersService.list });
  return (
    <>
      <PageHeader title="Stock Transfers" description="Transfers involving your shop." />
      <DataTable
        data={data}
        loading={isLoading}
        rowKey={(r) => r.id as number}
        columns={[
          { key: "id", header: "ID" },
          { key: "fromShopName", header: "From" },
          { key: "toShopName", header: "To" },
          { key: "transferType", header: "Type" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </>
  );
}
