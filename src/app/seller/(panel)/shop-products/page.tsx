"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { shopProductsService } from "@/services/shopProducts.service";
import { productsService } from "@/services/products.service";
import { brandsService, categoriesService } from "@/services/catalog.service";
import { useShopContext } from "@/hooks/useShopContext";
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
  pricingType: z.enum(["SINGLE", "BULK"]).optional(),
  isActive: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

export default function ShopProductsPage() {
  const qc = useQueryClient();
  const { currentShopId } = useShopContext();
  const { data = [] } = useQuery({
    queryKey: ["shop-products", currentShopId],
    queryFn: () => shopProductsService.list(currentShopId ?? undefined),
    enabled: Boolean(currentShopId),
  });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => productsService.list() });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: brandsService.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["shop-products"] });

  // Shop-product responses only carry productId/name — join with the master
  // catalog to fill Item, thumbnail image, Category and Brand.
  const rows = useMemo(() => {
    const productMap = new Map(products.map((p) => [String(p.id), p]));
    const catMap = new Map(categories.map((c) => [String(c.id), c.name]));
    const brandMap = new Map(brands.map((b) => [String(b.id), b.name]));
    return data.map((sp) => {
      const p = productMap.get(String(sp.productId));
      return {
        ...sp,
        itemName: sp.itemName || p?.itemName || "—",
        imageUrl: sp.imageUrl || p?.images?.[0],
        categoryName:
          p?.categoryName ?? (p?.categoryId != null ? catMap.get(String(p.categoryId)) : undefined) ?? "—",
        brandName: p?.brandName ?? (p?.brandId != null ? brandMap.get(String(p.brandId)) : undefined) ?? "—",
      } as ShopProduct;
    });
  }, [data, products, categories, brands]);

  return (
    <CrudManagementPage<ShopProduct>
      title="Shop Products"
      description="Shop-wise inventory, prices, and stock levels."
      addHref="/seller/products"
      rows={rows}
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
            pricingType: record?.pricingType ?? "SINGLE",
            isActive: record?.isActive ?? true,
          }}
          fields={[
            { name: "itemName", label: "Item Name", colSpan: 2 },
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
                { label: "Single", value: "SINGLE" },
                { label: "Bulk", value: "BULK" },
              ],
            },
            { name: "isActive", label: "Active", type: "switch" },
          ]}
          onSubmit={async (values) => {
            // "Add New" navigates to Products (addHref); this form only edits an
            // existing shop product's pricing. Map to the backend payload.
            if (record) {
              await shopProductsService.update(record.id, {
                shopId: record.shopId,
                productId: record.productId,
                sku: values.sku,
                sellingPrice: values.sellingPrice,
                costPrice: values.inputPrice,
                mrp: values.mrpPrice,
                pricingType: values.pricingType,
                lowStockThreshold: values.lowStockQty,
              });
              // Quantity is not part of the update payload — the backend tracks
              // stock separately, so push the difference via adjust-stock.
              const delta = (values.qty ?? 0) - (record.qty ?? 0);
              if (delta !== 0) {
                await shopProductsService.adjustStock(record.id, delta);
              }
              invalidate();
            }
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
    />
  );
}
