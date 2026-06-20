"use client";
// Shop owners view global products and add to their shop inventory
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ImagePreview } from "@/components/common/ImagePreview";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { productsService } from "@/services/products.service";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function ShopOwnerProductsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: () => productsService.list() });
  const approved = data.filter((p) => p.approvalStatus === "APPROVED" && p.isActiveGlobal);

  return (
    <>
      <PageHeader title="Products" description="Approved master catalog. Add products to your shop inventory." />
      <DataTable
        data={approved}
        loading={isLoading}
        rowKey={(r) => r.id as number}
        columns={[
          {
            key: "image",
            header: "",
            render: (r) => (
              <div className="h-10 w-10">
                <ImagePreview src={r.images?.[0]} alt={r.itemName} className="h-full w-full" />
              </div>
            ),
          },
          { key: "itemName", header: "Item", render: (r) => <span className="font-medium">{r.itemName}</span> },
          { key: "sku", header: "SKU" },
          { key: "categoryName", header: "Category" },
          { key: "brandName", header: "Brand" },
          { key: "approvalStatus", header: "Status", render: (r) => <StatusBadge status={r.approvalStatus} /> },
        ]}
        rowActions={(r) => (
          <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.success(`Added ${r.itemName} to shop`)}>
            <Plus className="h-3.5 w-3.5" /> Add to Shop
          </Button>
        )}
      />
    </>
  );
}
