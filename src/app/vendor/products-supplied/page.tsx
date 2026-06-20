"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ImagePreview } from "@/components/common/ImagePreview";
import { formatCurrency } from "@/lib/utils";
import { shopProductsService } from "@/services/shopProducts.service";

export default function VendorProductsSuppliedPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["shop-products"], queryFn: () => shopProductsService.list() });

  return (
    <>
      <PageHeader title="Products Supplied" description="All products you've supplied to shops." />
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
          { key: "categoryName", header: "Category" },
          { key: "brandName", header: "Brand" },
          { key: "qty", header: "Qty", align: "right" },
          { key: "inputPrice", header: "Input Price", align: "right", render: (r) => formatCurrency(r.inputPrice) },
        ]}
      />
    </>
  );
}
