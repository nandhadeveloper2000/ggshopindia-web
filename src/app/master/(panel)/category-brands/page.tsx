"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  brandsService,
  categoriesService,
  productTypesService,
  subCategoriesService,
} from "@/services/catalog.service";
import { categoryBrandsService } from "@/services/category-brands.service";
import type { Brand, CategoryBrand, ProductType, SubCategory } from "@/types/catalog.types";

function BrandLogo({ url, name }: { url?: string; name?: string }) {
  if (!url)
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded bg-muted text-[10px]">
        {name?.[0] ?? "?"}
      </span>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={name ?? ""} className="h-7 w-7 rounded bg-white object-contain p-0.5" />;
}

/** Category → Sub Category → Product Type cascade selectors, shared by the filter bar and dialogs. */
function CascadeSelects({
  subCategories,
  productTypes,
  categoryId,
  subCategoryId,
  productTypeId,
  onCategory,
  onSubCategory,
  onProductType,
  categories,
  includeAll,
}: {
  subCategories: SubCategory[];
  productTypes: ProductType[];
  categoryId: string;
  subCategoryId: string;
  productTypeId: string;
  onCategory: (v: string) => void;
  onSubCategory: (v: string) => void;
  onProductType: (v: string) => void;
  categories: { id: CategoryBrand["categoryId"]; name: string }[];
  includeAll?: boolean;
}) {
  const ALL = "all";
  const subOptions = useMemo(
    () => subCategories.filter((s) => categoryId && String(s.categoryId) === categoryId),
    [subCategories, categoryId],
  );
  const typeOptions = useMemo(
    () => productTypes.filter((p) => subCategoryId && String(p.subCategoryId) === subCategoryId),
    [productTypes, subCategoryId],
  );
  const val = (v: string) => (includeAll && !v ? ALL : v);
  const set = (fn: (v: string) => void) => (v: string) => fn(v === ALL ? "" : v);

  return (
    <>
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select value={val(categoryId)} onValueChange={set(onCategory)}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {includeAll && <SelectItem value={ALL}>All categories</SelectItem>}
            {categories.map((c) => (
              <SelectItem key={String(c.id)} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Sub Category</Label>
        <Select value={val(subCategoryId)} onValueChange={set(onSubCategory)} disabled={!categoryId}>
          <SelectTrigger>
            <SelectValue placeholder={!categoryId ? "Select category first" : "Select sub category"} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {includeAll && <SelectItem value={ALL}>All sub categories</SelectItem>}
            {subOptions.map((s) => (
              <SelectItem key={String(s.id)} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Product Type</Label>
        <Select value={val(productTypeId)} onValueChange={set(onProductType)} disabled={!subCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder={!subCategoryId ? "Select sub category first" : "Select product type"} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {includeAll && <SelectItem value={ALL}>All product types</SelectItem>}
            {typeOptions.map((p) => (
              <SelectItem key={String(p.id)} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

export default function CategoryBrandsPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<CategoryBrand | null>(null);

  // Filter cascade.
  const [fCategory, setFCategory] = useState("");
  const [fSubCategory, setFSubCategory] = useState("");
  const [fProductType, setFProductType] = useState("");

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });
  const { data: subCategories = [] } = useQuery({ queryKey: ["sub-categories"], queryFn: subCategoriesService.list });
  const { data: productTypes = [] } = useQuery({ queryKey: ["product-types"], queryFn: productTypesService.list });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: brandsService.list });

  const { data: rows = [], isFetching, refetch } = useQuery({
    queryKey: ["category-brands", fCategory, fSubCategory, fProductType],
    queryFn: () =>
      categoryBrandsService.listRows({
        categoryId: fCategory || undefined,
        subCategoryId: fSubCategory || undefined,
        productTypeId: fProductType || undefined,
      }),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["category-brands"] });

  // Refresh the mappings plus the cascade lookups (new categories/types/brands).
  const refresh = () =>
    Promise.all([
      refetch(),
      qc.invalidateQueries({ queryKey: ["categories"] }),
      qc.invalidateQueries({ queryKey: ["sub-categories"] }),
      qc.invalidateQueries({ queryKey: ["product-types"] }),
      qc.invalidateQueries({ queryKey: ["brands"] }),
    ]);

  const remove = async (r: CategoryBrand) => {
    if (!window.confirm(`Remove ${r.productTypeName ?? "product type"} → ${r.brandName}?`)) return;
    try {
      await categoryBrandsService.remove(r.id);
      toast.success("Mapping removed");
      invalidate();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Brand Mapping</h1>
          <p className="text-sm text-muted-foreground">
            Pick a category, sub category and product type, then map one or many brands to it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add mappings
          </Button>
        </div>
      </div>

      {/* Filter cascade */}
      <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-3">
        <CascadeSelects
          categories={categories}
          subCategories={subCategories}
          productTypes={productTypes}
          categoryId={fCategory}
          subCategoryId={fSubCategory}
          productTypeId={fProductType}
          onCategory={(v) => {
            setFCategory(v);
            setFSubCategory("");
            setFProductType("");
          }}
          onSubCategory={(v) => {
            setFSubCategory(v);
            setFProductType("");
          }}
          onProductType={setFProductType}
          includeAll
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">S.No</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Sub Category</th>
              <th className="px-4 py-3 text-left">Product Type</th>
              <th className="px-4 py-3 text-left">Brand</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No mappings yet. Click “Add mappings”.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={String(r.id)} className="border-t">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3">{r.categoryName ?? "—"}</td>
                <td className="px-4 py-3">{r.subCategoryName ?? "—"}</td>
                <td className="px-4 py-3 font-medium">{r.productTypeName ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <BrandLogo url={r.brandLogoUrl} name={r.brandName} />
                    <span>{r.brandName ?? "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <button className="text-primary hover:underline" onClick={() => setEditRow(r)}>
                      Edit
                    </button>
                    <button className="text-destructive hover:underline" onClick={() => remove(r)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addOpen && (
        <AddMappingsDialog
          categories={categories}
          subCategories={subCategories}
          productTypes={productTypes}
          brands={brands}
          onClose={() => setAddOpen(false)}
          onSaved={invalidate}
        />
      )}
      {editRow && (
        <EditMappingDialog
          row={editRow}
          categories={categories}
          subCategories={subCategories}
          productTypes={productTypes}
          brands={brands}
          onClose={() => setEditRow(null)}
          onSaved={invalidate}
        />
      )}
    </div>
  );
}

function AddMappingsDialog({
  categories,
  subCategories,
  productTypes,
  brands,
  onClose,
  onSaved,
}: {
  categories: { id: CategoryBrand["categoryId"]; name: string }[];
  subCategories: SubCategory[];
  productTypes: ProductType[];
  brands: Brand[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [productTypeId, setProductTypeId] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const { data: existing = [] } = useQuery({
    queryKey: ["ptb-existing", productTypeId],
    queryFn: () => categoryBrandsService.listByProductType(productTypeId),
    enabled: !!productTypeId,
  });
  const existingIds = useMemo(() => new Set(existing.map((e) => String(e.brandId))), [existing]);

  const filtered = brands.filter((b) => b.name.toLowerCase().includes(search.trim().toLowerCase()));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const willCreate = [...selected].filter((id) => !existingIds.has(id)).length;

  const save = async () => {
    if (!productTypeId) return toast.error("Select a product type");
    const ids = [...selected];
    if (ids.length === 0) return toast.error("Select at least one brand");
    setSaving(true);
    try {
      const created = await categoryBrandsService.createBulk(productTypeId, ids);
      toast.success(`Created ${created.length} mapping(s)`);
      onSaved();
      onClose();
    } catch {
      toast.error("Could not save mappings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add mappings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <CascadeSelects
              categories={categories}
              subCategories={subCategories}
              productTypes={productTypes}
              categoryId={categoryId}
              subCategoryId={subCategoryId}
              productTypeId={productTypeId}
              onCategory={(v) => {
                setCategoryId(v);
                setSubCategoryId("");
                setProductTypeId("");
              }}
              onSubCategory={(v) => {
                setSubCategoryId(v);
                setProductTypeId("");
              }}
              onProductType={setProductTypeId}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Brands (pick one or many)</Label>
              <div className="text-xs">
                <button
                  className="text-primary hover:underline"
                  onClick={() => setSelected(new Set(filtered.map((b) => String(b.id))))}
                >
                  Select all
                </button>
                <span className="mx-1 text-muted-foreground">·</span>
                <button className="text-muted-foreground hover:underline" onClick={() => setSelected(new Set())}>
                  Clear
                </button>
              </div>
            </div>
            <Input placeholder="Search brand…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="grid max-h-52 grid-cols-1 gap-1.5 overflow-y-auto rounded-md border p-2 sm:grid-cols-2">
              {filtered.length === 0 && (
                <p className="col-span-2 py-4 text-center text-sm text-muted-foreground">No brands.</p>
              )}
              {filtered.map((b) => {
                const id = String(b.id);
                const already = existingIds.has(id);
                return (
                  <label
                    key={id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-accent"
                  >
                    <Checkbox checked={selected.has(id)} onCheckedChange={() => toggle(id)} />
                    <BrandLogo url={b.logoUrl} name={b.name} />
                    <span className="truncate">{b.name}</span>
                    {already && <span className="ml-auto text-[10px] text-muted-foreground">mapped</span>}
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{selected.size}</span> · Will create:{" "}
              <span className="font-medium text-foreground">{willCreate}</span> new mappings
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !productTypeId || selected.size === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save mappings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditMappingDialog({
  row,
  categories,
  subCategories,
  productTypes,
  brands,
  onClose,
  onSaved,
}: {
  row: CategoryBrand;
  categories: { id: CategoryBrand["categoryId"]; name: string }[];
  subCategories: SubCategory[];
  productTypes: ProductType[];
  brands: Brand[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [categoryId, setCategoryId] = useState(row.categoryId != null ? String(row.categoryId) : "");
  const [subCategoryId, setSubCategoryId] = useState(row.subCategoryId != null ? String(row.subCategoryId) : "");
  const [productTypeId, setProductTypeId] = useState(row.productTypeId != null ? String(row.productTypeId) : "");
  const [brandId, setBrandId] = useState(String(row.brandId));
  const [saving, setSaving] = useState(false);

  // If the row is missing its cascade ids (legacy), derive from the product type once loaded.
  useEffect(() => {
    if (categoryId || !productTypeId) return;
    const pt = productTypes.find((p) => String(p.id) === productTypeId);
    if (pt?.categoryId != null) setCategoryId(String(pt.categoryId));
    if (pt?.subCategoryId != null) setSubCategoryId(String(pt.subCategoryId));
  }, [productTypes, productTypeId, categoryId]);

  const save = async () => {
    if (!productTypeId) return toast.error("Select a product type");
    if (!brandId) return toast.error("Select a brand");
    setSaving(true);
    try {
      await categoryBrandsService.update(row.id, { productTypeId, brandId });
      toast.success("Mapping updated");
      onSaved();
      onClose();
    } catch {
      toast.error("Could not update (maybe it already exists)");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit mapping</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-1">
            <CascadeSelects
              categories={categories}
              subCategories={subCategories}
              productTypes={productTypes}
              categoryId={categoryId}
              subCategoryId={subCategoryId}
              productTypeId={productTypeId}
              onCategory={(v) => {
                setCategoryId(v);
                setSubCategoryId("");
                setProductTypeId("");
              }}
              onSubCategory={(v) => {
                setSubCategoryId(v);
                setProductTypeId("");
              }}
              onProductType={setProductTypeId}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Brand</Label>
            <Select value={brandId} onValueChange={setBrandId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {brands.map((b) => (
                  <SelectItem key={String(b.id)} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
