"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Check, ChevronDown, ChevronUp, Plus, Store, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { WishlistButton } from "@/components/ecommerce/WishlistButton";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import type { Product } from "@/types/product.types";

const SORTS = [
  { value: "popularity", label: "Popularity" },
  { value: "latest", label: "Latest Products" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
];

// Shape of the product's raw variation-builder payload (`product.variant`).
interface VariantRow {
  sku?: string;
  combo?: Record<string, string>;
  images?: string[];
}
interface VariantPayload {
  rows?: VariantRow[];
}

interface Swatch {
  image: string;
  label: string;
  combo?: Record<string, string>;
}

/** Base image + one thumbnail per colour/variant (deduped), for the hover swatches. */
function getSwatches(product: Product): Swatch[] {
  const out: Swatch[] = [];
  const seen = new Set<string>();
  const push = (image?: string | null, label = "", combo?: Record<string, string>) => {
    if (image && !seen.has(image)) {
      seen.add(image);
      out.push({ image, label, combo });
    }
  };
  // Base variant — colour/RAM/storage come from the product's dynamic fields.
  const df = product.dynamicFields ?? {};
  const baseCombo: Record<string, string> = {};
  if (df.color) baseCombo.color = df.color;
  if (df.ram) baseCombo.ram = df.ram;
  if (df.internalstorage) baseCombo.internalstorage = df.internalstorage;
  push(product.images?.[0], df.color ?? product.itemName, Object.keys(baseCombo).length ? baseCombo : undefined);

  const v = product.variant as VariantPayload | undefined;
  v?.rows?.forEach((row) => {
    const label = row.combo?.color ?? Object.values(row.combo ?? {}).join(" ");
    push(row.images?.[0], label, row.combo);
  });
  return out;
}

/** Formats a variant combo as "Color • RAM • Storage" (drops the redundant "RAM" word). */
function specOf(combo?: Record<string, string>): string {
  if (!combo) return "";
  const ram = combo.ram ? combo.ram.replace(/\s*RAM\s*/i, "").trim() : "";
  return [combo.color, ram, combo.internalstorage].filter(Boolean).join(" • ");
}

/** A single listing card: variant swatches that swap the image + spec on select. */
export function ProductListingCard({
  product,
  compareOn,
  onToggleCompare,
  query,
}: {
  product: Product;
  compareOn: boolean;
  onToggleCompare: () => void;
  /** Search query — the card opens on the variant whose colour it mentions. */
  query?: string;
}) {
  const swatches = useMemo(() => getSwatches(product), [product]);
  const matchIdx = useMemo(() => {
    if (!query) return 0;
    const q = query.toLowerCase();
    const idx = swatches.findIndex((s) => s.combo?.color && q.includes(s.combo.color.toLowerCase()));
    return idx >= 0 ? idx : 0;
  }, [swatches, query]);
  const [active, setActive] = useState(matchIdx);
  useEffect(() => setActive(matchIdx), [matchIdx]);
  const current = swatches[active] ?? swatches[0];
  const img = current?.image ?? product.images?.[0];
  const spec = specOf(current?.combo);
  // Carry the selected colour to the detail page so it opens on that variant.
  const activeColor = current?.combo?.color;
  const href =
    routes.customer.productDetails(product.id, product.itemName) +
    (activeColor ? `?color=${encodeURIComponent(activeColor)}` : "");

  return (
    <Card className="group relative flex flex-col overflow-hidden transition hover:shadow-md">
      <WishlistButton
        productId={product.id}
        variant="secondary"
        className="absolute right-2 top-2 z-10 rounded-full bg-background/90 shadow-sm"
      />

      <Link href={href} className="block">
        <div className="flex aspect-square items-center justify-center bg-white p-4">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={product.itemName} className="h-full w-full object-contain" />
          ) : (
            <Store className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
      </Link>

      {/* Variant swatches — always visible; select to swap the image + spec */}
      {swatches.length > 1 && (
        <div className="flex items-center gap-1.5 px-3 pt-2.5">
          {swatches.slice(0, 5).map((s, i) => (
            <button
              key={i}
              type="button"
              title={s.label}
              aria-label={s.label || `Variant ${i + 1}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={(e) => {
                e.preventDefault();
                setActive(i);
              }}
              className={cn(
                "h-7 w-7 shrink-0 overflow-hidden rounded-full border bg-white transition",
                active === i ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/60",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
          {swatches.length > 5 && (
            <span className="text-xs font-semibold text-primary">+{swatches.length - 5}</span>
          )}
        </div>
      )}

      <div className="space-y-0.5 px-3 pt-2">
        <Link href={href}>
          <p className="line-clamp-2 text-sm text-foreground transition hover:text-primary">{product.itemName}</p>
        </Link>
        {spec && <p className="text-xs text-muted-foreground">{spec}</p>}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 p-3 pt-2">
        <button
          type="button"
          onClick={onToggleCompare}
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium",
            compareOn ? "text-primary" : "text-muted-foreground hover:text-primary",
          )}
        >
          {compareOn ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} Compare
        </button>
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link href={href}>Add to Cart</Link>
        </Button>
      </div>
    </Card>
  );
}

/**
 * Reliance Digital-style brand product listing: a left Filters sidebar, a
 * "{Brand} {Category} (N)" heading with a Sort modal, and a product grid whose
 * cards reveal variant swatches on hover.
 */
export function BrandProductListing({
  title,
  products,
  loading,
}: {
  title: string;
  products: Product[];
  loading: boolean;
}) {
  const [available, setAvailable] = useState(true);
  const [sort, setSort] = useState("latest");
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [compare, setCompare] = useState<Set<string>>(new Set());

  const toggleCompare = (id: string) =>
    setCompare((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const list = useMemo(() => {
    let l = products.slice();
    if (available) l = l.filter((p) => p.isActiveGlobal && p.approvalStatus === "APPROVED");
    l.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    return l;
  }, [products, available, sort]);

  const activeFilters = available ? 1 : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Filters sidebar */}
      <aside className="h-fit rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">Filters</span>
            {activeFilters > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                {activeFilters}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAvailable(false)}
              className="text-sm font-medium text-primary hover:underline"
            >
              Clear All
            </button>
            <button type="button" onClick={() => setFiltersOpen((o) => !o)} aria-label="Toggle filters">
              {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="mt-3">
            {available ? (
              <button
                type="button"
                onClick={() => setAvailable(false)}
                className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-sm font-medium text-primary"
              >
                Available <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAvailable(true)}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <span className="h-4 w-4 rounded border border-muted-foreground/40" />
                Available
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Main column */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold sm:text-xl">
            {title} <span className="font-normal text-muted-foreground">({list.length})</span>
          </h2>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setSortOpen(true)}>
            <ArrowUpDown className="h-4 w-4" /> Sort
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading products…</p>
        ) : list.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
              <Store className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No products found</p>
              <p className="text-xs text-muted-foreground">Try removing filters or pick another brand.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => (
              <ProductListingCard
                key={p.id}
                product={p}
                compareOn={compare.has(String(p.id))}
                onToggleCompare={() => toggleCompare(String(p.id))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sort modal */}
      <Dialog open={sortOpen} onOpenChange={setSortOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle className="text-lg font-semibold">Sort by</DialogTitle>
          <DialogDescription className="sr-only">Choose how to order the products.</DialogDescription>
          <div className="mt-2 space-y-1">
            {SORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  setSort(s.value);
                  setSortOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left text-sm transition hover:bg-accent"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border",
                    sort === s.value ? "border-primary" : "border-muted-foreground/40",
                  )}
                >
                  {sort === s.value && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                {s.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
