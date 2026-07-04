"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Layers, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ImagePreview } from "@/components/common/ImagePreview";
import { productsService } from "@/services/products.service";
import {
  brandsService,
  categoriesService,
  modelsService,
  productTypesService,
  subCategoriesService,
} from "@/services/catalog.service";
import { attributeTemplatesService } from "@/services/attribute-templates.service";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { TemplateField } from "@/types/attribute-template.types";

type NamedOption = { id: string | number; name: string };

interface VariantRow {
  combo?: Record<string, string>;
  status?: string;
  sku?: string;
  details?: string;
  images?: string[];
  itemCondition?: string;
}

/** Read the variant rows out of the raw builder payload stored on the product. */
function variantRows(variant: unknown): VariantRow[] {
  if (variant && typeof variant === "object") {
    const rows = (variant as { rows?: unknown }).rows;
    if (Array.isArray(rows)) return rows as VariantRow[];
  }
  return [];
}

/** Map each variation-type key to its display label (e.g. internalstorage -> Internal Storage). */
function variantTypeLabels(variant: unknown): Record<string, string> {
  const map: Record<string, string> = {};
  if (variant && typeof variant === "object") {
    const types = (variant as { types?: unknown }).types;
    if (Array.isArray(types)) {
      for (const t of types) {
        if (t && typeof t === "object" && "key" in t) {
          const key = String((t as { key?: unknown }).key ?? "");
          if (key) map[key] = String((t as { label?: unknown }).label ?? key);
        }
      }
    }
  }
  return map;
}

export function ProductDetailsView({ productId }: { productId: string }) {
  const backHref = routes.superAdmin.products;
  const [activeImg, setActiveImg] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsService.get(productId),
    enabled: Boolean(productId),
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });
  const { data: subCategories = [] } = useQuery({ queryKey: ["sub-categories"], queryFn: subCategoriesService.list });
  const { data: productTypes = [] } = useQuery({ queryKey: ["product-types"], queryFn: productTypesService.list });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: brandsService.list });
  const { data: models = [] } = useQuery({ queryKey: ["models"], queryFn: modelsService.list });

  const catId = product?.categoryId != null ? String(product.categoryId) : "";
  const subId = product?.subCategoryId != null ? String(product.subCategoryId) : "";
  const typeId = product?.productTypeId != null ? String(product.productTypeId) : "";
  const { data: template } = useQuery({
    queryKey: ["attr-template", catId, subId, typeId],
    queryFn: () => attributeTemplatesService.getBySelection(catId, subId, typeId),
    enabled: Boolean(catId && subId && typeId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading product…
      </div>
    );
  }
  if (!product) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Product not found.</p>
        <Button asChild variant="outline">
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
          </Link>
        </Button>
      </div>
    );
  }

  const nameOf = (list: NamedOption[], id?: string | number, fallback?: string) =>
    (id != null ? list.find((x) => String(x.id) === String(id))?.name : undefined) ?? fallback ?? "—";

  const sections = (template?.sections ?? []).filter((s) => s.active !== false);
  const dyn = (product.dynamicFields ?? {}) as Record<string, unknown>;
  const descriptionKey = Object.keys(dyn).find((k) => /descrip/i.test(k));
  const description = descriptionKey ? String(dyn[descriptionKey] ?? "").trim() : "";
  const rows = variantRows(product.variant);
  const typeLabels = variantTypeLabels(product.variant);
  const images = product.images ?? [];
  const mainImage = images[activeImg] ?? images[0];

  const comboSummary = (combo?: Record<string, string>) =>
    combo
      ? Object.entries(combo)
          .map(([k, v]) => `${typeLabels[k] ?? k}: ${v}`)
          .join(" · ")
      : "—";

  const isImageField = (f: TemplateField) => f.inputType === "image" || f.inputType === "file";
  const fieldValue = (f: TemplateField) => {
    const v = dyn[f.key];
    if (v == null || v === "") return "—";
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "boolean") return v ? "Yes" : "No";
    return String(v);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" aria-label="Back">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Product Details</h1>
            <p className="text-sm text-muted-foreground">Full details for this product.</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`${backHref}/edit/?id=${product.id}`}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        {/* ─── Sticky sidebar: gallery + identity ─── */}
        <aside className="lg:sticky lg:top-4">
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            {/* Gallery */}
            <div className="border-b bg-muted/30 p-4">
              <div className="aspect-square overflow-hidden rounded-lg border bg-background">
                <ImagePreview src={mainImage} alt={product.itemName} className="h-full w-full" zoom />
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImg(i)}
                      className={cn(
                        "h-12 w-12 overflow-hidden rounded-md border bg-background transition",
                        i === activeImg ? "ring-2 ring-primary ring-offset-1" : "hover:opacity-80"
                      )}
                      aria-label={`View image ${i + 1}`}
                    >
                      <ImagePreview src={src} alt={`${product.itemName} ${i + 1}`} className="h-full w-full" zoom />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="space-y-4 p-4">
              <div>
                <h2 className="text-lg font-bold leading-snug">{product.itemName}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={product.approvalStatus} />
                  <StatusBadge status={product.isActiveGlobal} />
                </div>
              </div>

              <dl className="border-t pt-2 text-sm">
                <SidebarRow label="SKU" value={product.sku || "—"} mono />
                <SidebarRow label="Brand" value={nameOf(brands, product.brandId, product.brandName)} />
                <SidebarRow label="Model" value={nameOf(models, product.modelId, product.modelName)} />
                <SidebarRow label="Category" value={nameOf(categories, product.categoryId, product.categoryName)} />
                <SidebarRow
                  label="Sub Category"
                  value={nameOf(subCategories, product.subCategoryId, product.subCategoryName)}
                />
                <SidebarRow
                  label="Product Type"
                  value={nameOf(productTypes, product.productTypeId, product.productTypeName)}
                />
                <SidebarRow label="Variations" value={String(rows.length)} />
                <SidebarRow label="Active" value={product.isActiveGlobal ? "Yes" : "No"} />
              </dl>
            </div>
          </div>
        </aside>

        {/* ─── Scrolling content: specs + variations ─── */}
        <div className="min-w-0 space-y-6">
          {sections.map((section, si) => (
            <Section key={si} title={section.headingName}>
              <div className="space-y-6">
                {(section.groups ?? [])
                  .filter((g) => g.active !== false)
                  .map((group, gi) => (
                    <div key={gi}>
                      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {group.groupName}
                      </h4>
                      <dl className="grid gap-x-10 sm:grid-cols-2">
                        {(group.fields ?? [])
                          .filter((f) => f.active !== false)
                          .map((f) => (
                            <SpecField
                              key={f.key}
                              label={f.label}
                              value={fieldValue(f)}
                              image={isImageField(f) && dyn[f.key] ? String(dyn[f.key]) : undefined}
                              long={f.inputType === "textarea"}
                            />
                          ))}
                      </dl>
                    </div>
                  ))}
              </div>
            </Section>
          ))}

          {rows.length > 0 && (
            <Section title="Variations" icon={<Layers className="h-4 w-4" />} badge={String(rows.length)}>
              <div className="grid gap-4 xl:grid-cols-2">
                {rows.map((r, i) => (
                  <div key={i} className="rounded-lg border bg-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{comboSummary(r.combo)}</p>
                      <VariantStatus status={r.status || "Available"} />
                    </div>

                    {r.images && r.images.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {r.images.map((src, j) => (
                          <div key={j} className="h-12 w-12 overflow-hidden rounded-md border">
                            <ImagePreview src={src} alt={`variant ${i + 1} image ${j + 1}`} className="h-full w-full" zoom />
                          </div>
                        ))}
                      </div>
                    )}

                    <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
                      <Fact label="SKU" value={r.sku || "—"} mono />
                      <Fact label="Item Condition" value={r.itemCondition || "—"} />
                    </dl>

                    {(r.details || description) && (
                      <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">{r.details || description}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {sections.length === 0 && rows.length === 0 && (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No attribute template for this product type.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- small presentational helpers ---------- */

function Section({
  title,
  icon,
  badge,
  children,
}: {
  title: string;
  icon?: ReactNode;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-5 py-3">
        <span className="h-4 w-1 rounded-full bg-primary" />
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <h3 className="font-semibold">{title}</h3>
        {badge && (
          <span className="ml-1 inline-flex min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-medium text-primary">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** A spec field: inline (label ↔ value) by default; full-width block for images or long text. */
function SpecField({
  label,
  value,
  image,
  long,
}: {
  label: string;
  value: string;
  image?: string;
  long?: boolean;
}) {
  if (image) {
    return (
      <div className="flex items-center justify-between gap-4 border-b border-dashed py-2.5 sm:col-span-2">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="h-16 w-16 overflow-hidden rounded-md border">
          <ImagePreview src={image} alt={label} className="h-full w-full" zoom />
        </dd>
      </div>
    );
  }
  if (long || value.length > 60) {
    return (
      <div className="border-b border-dashed py-2.5 sm:col-span-2">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="mt-1 text-sm leading-relaxed">{value}</dd>
      </div>
    );
  }
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

function SidebarRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-dashed py-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right font-medium", mono && "font-mono text-xs")}>{value}</dd>
    </div>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-medium", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function VariantStatus({ status }: { status: string }) {
  const available = status.toLowerCase() === "available";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        available ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-muted text-muted-foreground"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", available ? "bg-emerald-500" : "bg-muted-foreground/50")} />
      {status}
    </span>
  );
}
