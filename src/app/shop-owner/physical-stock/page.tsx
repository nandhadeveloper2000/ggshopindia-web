"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { physicalStocksService } from "@/services/physicalStocks.service";

export default function PhysicalStockPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["physical-stocks"], queryFn: physicalStocksService.list });

  return (
    <>
      <PageHeader
        title="Physical Stock"
        description="Stock count adjustments with system vs physical comparison."
        actions={
          <Button className="gap-2" onClick={() => toast.info("Adjustment form opens here")}>
            <Plus className="h-4 w-4" /> New Adjustment
          </Button>
        }
      />
      <DataTable
        data={data}
        loading={isLoading}
        rowKey={(r) => r.id as number}
        columns={[
          { key: "shopName", header: "Shop" },
          { key: "itemName", header: "Item", render: (r) => <span className="font-medium">{r.itemName}</span> },
          { key: "systemQty", header: "System", align: "right" },
          { key: "physicalQty", header: "Physical", align: "right" },
          {
            key: "differenceQty",
            header: "Diff",
            align: "right",
            render: (r) => (
              <span className={r.differenceQty < 0 ? "text-destructive font-medium" : r.differenceQty > 0 ? "text-success font-medium" : ""}>
                {r.differenceQty > 0 ? "+" : ""}
                {r.differenceQty}
              </span>
            ),
          },
          { key: "notes", header: "Notes" },
          { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </>
  );
}
