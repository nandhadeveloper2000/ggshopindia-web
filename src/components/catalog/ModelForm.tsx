"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoriesService, modelsService } from "@/services/catalog.service";
import { categoryBrandsService } from "@/services/category-brands.service";
import type { ProductModel } from "@/types/catalog.types";

interface Props {
  record: ProductModel | null;
  onSaved: () => void;
  close: () => void;
}

/**
 * Auto-generate a model number from the brand + model name plus a short random
 * suffix for uniqueness, e.g. Apple + "Galaxy S26" -> "APP-GALAXY-K7QM".
 */
function generateModelNumber(brandName?: string, modelName?: string, suffix?: string): string {
  const alnum = (s?: string) => (s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const brand = alnum(brandName).slice(0, 3) || "MDL";
  const name = alnum(modelName).slice(0, 6);
  const rand = (suffix ?? Math.random().toString(36).slice(2, 6)).toUpperCase();
  return [brand, name, rand].filter(Boolean).join("-");
}

export function ModelForm({ record, onSaved, close }: Props) {
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });

  const [categoryId, setCategoryId] = useState(record?.categoryId != null ? String(record.categoryId) : "");
  const [brandId, setBrandId] = useState(record?.brandId != null ? String(record.brandId) : "");
  const [name, setName] = useState(record?.name ?? "");
  const [modelNumber, setModelNumber] = useState(record?.modelNumber ?? "");
  const [active, setActive] = useState(record?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  // Brands available for the chosen category come from the Category-Brand mapping.
  const { data: mappings = [], isFetching: loadingBrands } = useQuery({
    queryKey: ["cb-brands", categoryId],
    queryFn: () => categoryBrandsService.list(categoryId),
    enabled: !!categoryId,
  });
  const brandOptions = useMemo(
    () => mappings.map((m) => ({ id: String(m.brandId), name: m.brandName ?? String(m.brandId) })),
    [mappings]
  );
  const selectedBrandName = brandOptions.find((b) => b.id === brandId)?.name;

  // A stable random suffix so the auto-generated code doesn't churn per keystroke.
  const [autoSuffix, setAutoSuffix] = useState(() => Math.random().toString(36).slice(2, 6).toUpperCase());
  const [numberTouched, setNumberTouched] = useState(false);

  // Automatically assign the model number once a brand + name are present,
  // for new models, until the user edits the field themselves.
  useEffect(() => {
    if (record || numberTouched) return;
    if (!brandId || name.trim().length < 2) return;
    setModelNumber(generateModelNumber(selectedBrandName, name, autoSuffix));
  }, [record, numberTouched, brandId, name, selectedBrandName, autoSuffix]);

  const assignCode = () => {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    setAutoSuffix(suffix);
    setNumberTouched(false);
    setModelNumber(generateModelNumber(selectedBrandName, name, suffix));
    toast.success("Model number assigned");
  };

  const save = async () => {
    if (!categoryId) return toast.error("Select a category");
    if (!brandId) return toast.error("Select a brand");
    if (name.trim().length < 2) return toast.error("Enter a model name");
    setSaving(true);
    try {
      const payload: Partial<ProductModel> = {
        categoryId,
        brandId,
        name: name.trim(),
        modelNumber: modelNumber.trim() || undefined,
        isActive: active,
      };
      if (record) await modelsService.update(record.id, payload);
      else await modelsService.create(payload);
      toast.success("Saved successfully");
      onSaved();
      close();
    } catch {
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select
            value={categoryId}
            onValueChange={(v) => {
              setCategoryId(v);
              setBrandId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={String(c.id)} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Brand</Label>
          <Select value={brandId} onValueChange={setBrandId} disabled={!categoryId || brandOptions.length === 0}>
            <SelectTrigger>
              <SelectValue
                placeholder={
                  !categoryId
                    ? "Select category first"
                    : loadingBrands
                    ? "Loading brands…"
                    : brandOptions.length === 0
                    ? "No brands mapped"
                    : "Select brand"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {brandOptions.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categoryId && !loadingBrands && brandOptions.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No brands mapped to this category. Add them in “Brand Mapping”.
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Model Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Galaxy S26" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Model Number</Label>
            <button
              type="button"
              onClick={assignCode}
              className="text-xs font-medium text-primary hover:underline"
            >
              Assign Code
            </button>
          </div>
          <Input
            value={modelNumber}
            onChange={(e) => {
              setModelNumber(e.target.value);
              setNumberTouched(true);
            }}
            placeholder="e.g. SM-S926B"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="model-active" checked={active} onCheckedChange={(v) => setActive(Boolean(v))} />
        <Label htmlFor="model-active">Active</Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
        </Button>
      </div>
    </div>
  );
}
