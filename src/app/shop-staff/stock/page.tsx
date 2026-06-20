"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ImagePreview } from "@/components/common/ImagePreview";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { shopProductsService } from "@/services/shopProducts.service";

export default function StockPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["shop-products"], queryFn: () => shopProductsService.list() });
  return (
    <>
      <PageHeader title="Stock" description="Current stock levels for your shop." />
      <DataTable
        data={data}
        loading={isLoading}
        rowKey={(r) => r.id as number}
        columns={[
          {
            key: "image",
            header: "",
            render: (r) => (
              <div className="h-10 w-10">
                <ImagePreview src={r.imageUrl} className="h-full w-full" />
              </div>
            ),
          },
          { key: "itemName", header: "Item", render: (r) => <span className="font-medium">{r.itemName}</span> },
          { key: "sku", header: "SKU" },
          { key: "qty", header: "Qty", align: "right" },
          {
            key: "stock",
            header: "Status",
            render: (r) => {
              const out = r.qty === 0;
              const low = r.lowStockQty !== undefined && r.qty <= (r.lowStockQty ?? 0);
              return <Badge variant={out ? "destructive" : low ? "warning" : "success"}>{out ? "Out" : low ? "Low" : "OK"}</Badge>;
            },
          },
          { key: "sellingPrice", header: "Price", align: "right", render: (r) => formatCurrency(r.sellingPrice) },
        ]}
      />
    </>
  );
}
