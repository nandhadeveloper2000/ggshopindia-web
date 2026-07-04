"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import { CrudManagementPage } from "@/components/common/CrudManagementPage";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ImagePreview } from "@/components/common/ImagePreview";
import { Button } from "@/components/ui/button";
import { productsService } from "@/services/products.service";
import { brandsService, categoriesService } from "@/services/catalog.service";
import { routes } from "@/lib/routes";
import type { Product } from "@/types/product.types";

/** Number of variant rows stored on the product's raw variant payload. */
function variantCount(variant: unknown): number {
  if (variant && typeof variant === "object") {
    const rows = (variant as { rows?: unknown }).rows;
    if (Array.isArray(rows)) return rows.length;
  }
  return 0;
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["products"], queryFn: () => productsService.list() });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: brandsService.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["products"] });

  // The backend returns only IDs (no names), so resolve Category/Brand client-side.
  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [String(c.id), c.name]));
    return (r: Product) => r.categoryName ?? (r.categoryId != null ? map.get(String(r.categoryId)) : undefined) ?? "—";
  }, [categories]);
  const brandName = useMemo(() => {
    const map = new Map(brands.map((b) => [String(b.id), b.name]));
    return (r: Product) => r.brandName ?? (r.brandId != null ? map.get(String(r.brandId)) : undefined) ?? "—";
  }, [brands]);

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
        { key: "sku", header: "SKU", render: (r) => r.sku || "—" },
        { key: "categoryName", header: "Category", render: (r) => categoryName(r) },
        { key: "brandName", header: "Brand", render: (r) => brandName(r) },
        {
          key: "variants",
          header: "Variants",
          render: (r) => <span className="tabular-nums">{variantCount(r.variant)}</span>,
        },
        {
          key: "approvalStatus",
          header: "Approval",
          render: (r) => <StatusBadge status={r.approvalStatus} />,
        },
      ]}
      showStatus={false}
      onDelete={async (r) => {
        await productsService.remove(r.id);
        invalidate();
      }}
      customActions={(r) => (
        <>
          <Button asChild size="icon" variant="ghost" className="h-8 w-8" aria-label="View">
            <Link href={`${routes.superAdmin.products}/view/?id=${r.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`${routes.superAdmin.products}/edit/?id=${r.id}`}>Edit</Link>
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
