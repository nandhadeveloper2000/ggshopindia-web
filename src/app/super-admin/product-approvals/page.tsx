"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ImagePreview } from "@/components/common/ImagePreview";
import { productsService } from "@/services/products.service";

export default function ProductApprovalsPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: () => productsService.list() });
  const pending = data.filter((p) => p.approvalStatus === "PENDING");
  const invalidate = () => qc.invalidateQueries({ queryKey: ["products"] });

  return (
    <>
      <PageHeader title="Product Approvals" description="Review and approve products submitted by shops." />
      <DataTable
        data={pending}
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
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="success"
              className="gap-1"
              onClick={async () => {
                await productsService.approve(r.id);
                toast.success("Approved");
                invalidate();
              }}
            >
              <Check className="h-3.5 w-3.5" /> Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="gap-1"
              onClick={async () => {
                await productsService.reject(r.id);
                toast.success("Rejected");
                invalidate();
              }}
            >
              <X className="h-3.5 w-3.5" /> Reject
            </Button>
          </div>
        )}
      />
    </>
  );
}
