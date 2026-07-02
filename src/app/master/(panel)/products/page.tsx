"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ImagePreview } from "@/components/common/ImagePreview";
import { Button } from "@/components/ui/button";
import { productsService } from "@/services/products.service";
import { routes } from "@/lib/routes";
import type { Product } from "@/types/product.types";

export default function ProductsPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["products"], queryFn: () => productsService.list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["products"] });

  return (
    <CrudManagementPage<Product>
      title="Products"
      description="Master catalog of products across the platform."
      rows={data}
      searchKeys={["itemName", "sku", "brandName", "categoryName"]}
      addHref={`${routes.superAdmin.products}/new`}
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
        { key: "itemName", header: "Item Name", render: (r) => <span className="font-medium">{r.itemName}</span> },
        { key: "sku", header: "SKU" },
        { key: "categoryName", header: "Category" },
        { key: "brandName", header: "Brand" },
        {
          key: "approvalStatus",
          header: "Approval",
          render: (r) => <StatusBadge status={r.approvalStatus} />,
        },
      ]}
      showStatus={false}
      viewContent={(r) => (
        <>
          <div className="flex gap-4 mb-3">
            <div className="h-32 w-32">
              <ImagePreview src={r.images?.[0]} alt={r.itemName} className="h-full w-full" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-semibold">{r.itemName}</h3>
              <StatusBadge status={r.approvalStatus} />
            </div>
          </div>
          <InfoRow label="SKU" value={r.sku} />
          <InfoRow label="Category" value={r.categoryName} />
          <InfoRow label="Sub Category" value={r.subCategoryName} />
          <InfoRow label="Brand" value={r.brandName} />
          <InfoRow label="Model" value={r.modelName} />
          <InfoRow label="Active" value={r.isActiveGlobal ? "Yes" : "No"} />
        </>
      )}
      onDelete={async (r) => {
        await productsService.remove(r.id);
        invalidate();
      }}
      customActions={(r) => (
        <>
          <Button asChild size="sm" variant="outline">
            <Link href={`${routes.superAdmin.products}/${r.id}/edit`}>Edit</Link>
          </Button>
          {r.approvalStatus === "PENDING" && (
            <>
              <Button
                size="sm"
                variant="success"
                onClick={async () => {
                  await productsService.approve(r.id);
                  toast.success("Approved");
                  invalidate();
                }}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  await productsService.reject(r.id);
                  toast.success("Rejected");
                  invalidate();
                }}
              >
                Reject
              </Button>
            </>
          )}
        </>
      )}
    />
  );
}
