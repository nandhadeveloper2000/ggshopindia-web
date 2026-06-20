"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { shopProductsService } from "@/services/shopProducts.service";
import { ImagePreview } from "@/components/common/ImagePreview";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { ShopProduct } from "@/types/product.types";

const schema = z.object({
  itemName: z.string().min(2),
  sku: z.string().min(2),
  unit: z.string().optional(),
  qty: z.coerce.number().int().min(0),
  lowStockQty: z.coerce.number().int().min(0).optional(),
  inputPrice: z.coerce.number().min(0),
  mrpPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  minSellingPrice: z.coerce.number().optional(),
  pricingType: z.enum(["FIXED", "MRP", "DYNAMIC"]).optional(),
  isActive: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

export default function ShopProductsPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["shop-products"], queryFn: () => shopProductsService.list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["shop-products"] });

  return (
    <CrudManagementPage<ShopProduct>
      title="Shop Products"
      description="Shop-wise inventory, prices, and stock levels."
      rows={data}
      searchKeys={["itemName", "sku", "itemCode", "brandName"]}
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
        {
          key: "stock",
          header: "Stock",
          render: (r) => {
            const out = r.qty === 0;
            const low = r.lowStockQty !== undefined && r.qty <= (r.lowStockQty ?? 0);
            return <Badge variant={out ? "destructive" : low ? "warning" : "success"}>{out ? "Out" : low ? "Low" : "OK"}</Badge>;
          },
        },
        { key: "sellingPrice", header: "Selling", align: "right", render: (r) => formatCurrency(r.sellingPrice) },
        { key: "mrpPrice", header: "MRP", align: "right", render: (r) => formatCurrency(r.mrpPrice) },
      ]}
      formTitle="Shop Product"
      formContent={(record, close) => (
        <GenericForm<Values>
          schema={schema}
          defaultValues={{
            itemName: record?.itemName ?? "",
            sku: record?.sku ?? "",
            unit: record?.unit ?? "PCS",
            qty: record?.qty ?? 0,
            lowStockQty: record?.lowStockQty ?? 10,
            inputPrice: record?.inputPrice ?? 0,
            mrpPrice: record?.mrpPrice ?? 0,
            sellingPrice: record?.sellingPrice ?? 0,
            minSellingPrice: record?.minSellingPrice ?? 0,
            pricingType: record?.pricingType ?? "MRP",
            isActive: record?.isActive ?? true,
          }}
          fields={[
            { name: "itemName", label: "Item Name", colSpan: 2 },
            { name: "sku", label: "SKU" },
            { name: "unit", label: "Unit" },
            { name: "qty", label: "Quantity", type: "number" },
            { name: "lowStockQty", label: "Low Stock Threshold", type: "number" },
            { name: "inputPrice", label: "Input Price", type: "number" },
            { name: "mrpPrice", label: "MRP", type: "number" },
            { name: "sellingPrice", label: "Selling Price", type: "number" },
            { name: "minSellingPrice", label: "Min Selling Price", type: "number" },
            {
              name: "pricingType",
              label: "Pricing Type",
              type: "select",
              options: [
                { label: "Fixed", value: "FIXED" },
                { label: "MRP", value: "MRP" },
                { label: "Dynamic", value: "DYNAMIC" },
              ],
            },
            { name: "isActive", label: "Active", type: "switch" },
          ]}
          onSubmit={async (values) => {
            if (record) await shopProductsService.update(record.id, values);
            else await shopProductsService.create(values);
            invalidate();
          }}
          onCancel={close}
        />
      )}
      viewContent={(r) => (
        <>
          <InfoRow label="Item" value={r.itemName} />
          <InfoRow label="SKU" value={r.sku} />
          <InfoRow label="Code" value={r.itemCode} />
          <InfoRow label="Quantity" value={`${r.qty} ${r.unit ?? ""}`} />
          <InfoRow label="Input Price" value={formatCurrency(r.inputPrice)} />
          <InfoRow label="MRP" value={formatCurrency(r.mrpPrice)} />
          <InfoRow label="Selling" value={formatCurrency(r.sellingPrice)} />
          <InfoRow label="Vendor" value={r.vendorName} />
        </>
      )}
      onDelete={async (r) => {
        await shopProductsService.remove(r.id);
        invalidate();
      }}
      onToggleStatus={async (r) => {
        await shopProductsService.toggleStatus(r.id);
        invalidate();
      }}
    />
  );
}
