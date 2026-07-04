"use client";
// Shop owners view global products and add to their shop inventory
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ImagePreview } from "@/components/common/ImagePreview";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FormModal } from "@/components/common/FormModal";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { productsService } from "@/services/products.service";
import { brandsService, categoriesService } from "@/services/catalog.service";
import { shopProductsService } from "@/services/shopProducts.service";
import { useShopContext } from "@/hooks/useShopContext";
import { extractErrorMessage } from "@/lib/axios";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import type { Product } from "@/types/product.types";

interface VariantOption {
  sku: string;
  label: string;
}

/** Extract the variant rows (combo label + SKU) from the product's variant payload. */
function productVariants(variant: unknown): VariantOption[] {
  if (!variant || typeof variant !== "object") return [];
  const v = variant as { rows?: unknown; types?: { key?: string; label?: string }[] };
  const labelMap: Record<string, string> = {};
  if (Array.isArray(v.types)) {
    v.types.forEach((t) => {
      if (t?.key) labelMap[String(t.key)] = String(t.label ?? t.key);
    });
  }
  if (!Array.isArray(v.rows)) return [];
  return v.rows.map((r) => {
    const row = (r ?? {}) as { combo?: Record<string, string>; sku?: string };
    const combo = row.combo ?? {};
    const label = Object.entries(combo)
      .map(([k, val]) => `${labelMap[k] ?? k}: ${val}`)
      .join(" · ");
    return { sku: String(row.sku ?? ""), label: label || "Variant" };
  });
}

export default function ShopOwnerProductsPage() {
  const qc = useQueryClient();
  const { currentShopId } = useShopContext();
  const { data = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: () => productsService.list() });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: brandsService.list });
  const [addingId, setAddingId] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ product: Product; variants: VariantOption[] } | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const approved = data.filter((p) => p.approvalStatus === "APPROVED" && p.isActiveGlobal);

  // Backend returns only IDs, so resolve Category/Brand names client-side.
  const categoryName = useMemo(() => {
    const m = new Map(categories.map((c) => [String(c.id), c.name]));
    return (r: Product) => r.categoryName ?? (r.categoryId != null ? m.get(String(r.categoryId)) : undefined) ?? "—";
  }, [categories]);
  const brandName = useMemo(() => {
    const m = new Map(brands.map((b) => [String(b.id), b.name]));
    return (r: Product) => r.brandName ?? (r.brandId != null ? m.get(String(r.brandId)) : undefined) ?? "—";
  }, [brands]);

  const createShopProduct = async (product: Product, sku: string) => {
    if (!currentShopId) {
      toast.error("Select a shop location first (top-left switcher).");
      return;
    }
    setAddingId(String(product.id));
    try {
      await shopProductsService.create({
        shopId: currentShopId,
        productId: product.id,
        sku: sku || undefined,
        sellingPrice: 0,
        costPrice: 0,
        mrp: 0,
        // pricingType omitted — backend enum is SINGLE|BULK and defaults to SINGLE.
      });
      qc.invalidateQueries({ queryKey: ["shop-products"] });
      toast.success(`Added ${product.itemName} to shop`);
      setPicker(null);
    } catch (e) {
      toast.error(extractErrorMessage(e, "Could not add to shop"));
    } finally {
      setAddingId(null);
    }
  };

  const addToShop = (product: Product) => {
    const variants = productVariants(product.variant);
    if (variants.length > 0) {
      setSelectedIdx(0);
      setPicker({ product, variants });
    } else {
      createShopProduct(product, product.sku || "");
    }
  };

  const pickerAdding = picker ? addingId === String(picker.product.id) : false;

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
          { key: "sku", header: "SKU", render: (r) => r.sku || "—" },
          { key: "categoryName", header: "Category", render: (r) => categoryName(r) },
          { key: "brandName", header: "Brand", render: (r) => brandName(r) },
          { key: "approvalStatus", header: "Status", render: (r) => <StatusBadge status={r.approvalStatus} /> },
        ]}
        rowActions={(r) => (
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={addingId === String(r.id)}
            onClick={() => addToShop(r)}
          >
            {addingId === String(r.id) ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Add to Shop
          </Button>
        )}
      />

      {/* Variant picker — shown only when the product has variants. */}
      <FormModal
        open={!!picker}
        onOpenChange={(o) => !o && setPicker(null)}
        title="Choose a variant"
        description={picker ? `Select which variant of ${picker.product.itemName} to add to your shop.` : undefined}
      >
        {picker && (
          <div className="space-y-4">
            <RadioGroup
              value={String(selectedIdx)}
              onValueChange={(v) => setSelectedIdx(Number(v))}
              className="space-y-1.5"
            >
              {picker.variants.map((opt, i) => (
                <label
                  key={i}
                  htmlFor={`variant-${i}`}
                  className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-accent"
                >
                  <RadioGroupItem value={String(i)} id={`variant-${i}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{opt.label}</p>
                    {opt.sku && <p className="font-mono text-xs text-muted-foreground">{opt.sku}</p>}
                  </div>
                </label>
              ))}
            </RadioGroup>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPicker(null)}>
                Cancel
              </Button>
              <Button
                disabled={pickerAdding}
                onClick={() => createShopProduct(picker.product, picker.variants[selectedIdx]?.sku ?? "")}
              >
                {pickerAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add to Shop
              </Button>
            </div>
          </div>
        )}
      </FormModal>
    </>
  );
}
