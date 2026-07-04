"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { ModelForm } from "@/components/catalog/ModelForm";
import { brandsService, categoriesService, modelsService } from "@/services/catalog.service";
import { categoryBrandsService } from "@/services/category-brands.service";
import {
  exportModelsWorkbook,
  parseModelsWorkbook,
  type ModelSheet,
  type ModelWorkbookRow,
} from "@/lib/models-workbook";
import { extractErrorMessage } from "@/lib/axios";
import type { ProductModel } from "@/types/catalog.types";

export default function ModelsPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["models"], queryFn: modelsService.list });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: brandsService.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["models"] });

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  // Download filters — pick a category first, then a brand (mirrors the Add New form).
  const [downloadCategoryId, setDownloadCategoryId] = useState<string>("all");
  const [downloadBrandId, setDownloadBrandId] = useState<string>("all");

  // Brands mapped to the chosen category (same source the Add New form uses).
  const { data: downloadMappings = [] } = useQuery({
    queryKey: ["cb-brands", downloadCategoryId],
    queryFn: () => categoryBrandsService.list(downloadCategoryId),
    enabled: downloadCategoryId !== "all",
  });

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [String(c.id), c.name]));
    return (id?: ProductModel["categoryId"]) => (id != null ? map.get(String(id)) ?? "—" : "—");
  }, [categories]);

  const brandName = useMemo(() => {
    const map = new Map(brands.map((b) => [String(b.id), b.name]));
    return (r: ProductModel) => r.brandName ?? (r.brandId != null ? map.get(String(r.brandId)) : undefined) ?? "—";
  }, [brands]);

  // Full lists (like the Add New form): every category, and every brand mapped
  // to the chosen category (all brands when "All Categories").
  const downloadCategoryOptions = useMemo(
    () =>
      categories
        .map((c) => ({ id: String(c.id), name: c.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );
  const downloadBrandOptions = useMemo(() => {
    const list =
      downloadCategoryId === "all"
        ? brands.map((b) => ({ id: String(b.id), name: b.name }))
        : downloadMappings.map((m) => ({
            id: String(m.brandId),
            name: m.brandName ?? String(m.brandId),
          }));
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [brands, downloadMappings, downloadCategoryId]);

  // Name -> id lookups for resolving the Category/Brand columns on import.
  const categoryIdByName = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.name.trim().toLowerCase(), String(c.id)));
    return m;
  }, [categories]);
  const brandIdByName = useMemo(() => {
    const m = new Map<string, string>();
    brands.forEach((b) => m.set(b.name.trim().toLowerCase(), String(b.id)));
    return m;
  }, [brands]);

  // Download one sheet per brand — each tab holds that brand's existing models
  // (old data) plus a pre-filled row, so it doubles as a bulk-add sheet. With a
  // single brand selected, only that brand's sheet is produced.
  const handleDownload = () => {
    const catSelected = downloadCategoryId !== "all";
    const catLabel = catSelected
      ? downloadCategoryOptions.find((c) => c.id === downloadCategoryId)?.name ?? ""
      : "";
    const brandLabel =
      downloadBrandId === "all"
        ? ""
        : downloadBrandOptions.find((b) => b.id === downloadBrandId)?.name ?? "";

    let sheetBrands =
      downloadBrandId === "all"
        ? downloadBrandOptions
        : downloadBrandOptions.filter((b) => b.id === downloadBrandId);
    if (sheetBrands.length === 0 && downloadBrandId !== "all") {
      sheetBrands = [{ id: downloadBrandId, name: brandLabel || "Brand" }];
    }

    const sheets: ModelSheet[] = sheetBrands.map((b) => {
      const models = data.filter((r) => {
        if (catSelected && String(r.categoryId) !== downloadCategoryId) return false;
        return String(r.brandId) === b.id;
      });
      const rows: ModelWorkbookRow[] =
        models.length > 0
          ? models.map((r) => {
              const cat = categoryName(r.categoryId);
              return {
                category: cat === "—" ? catLabel : cat,
                brand: b.name,
                name: r.name,
                modelNumber: r.modelNumber ?? "",
                active: r.isActive ?? true,
              };
            })
          : [{ category: catLabel, brand: b.name, name: "", modelNumber: "", active: true }];
      return { sheetName: b.name, rows };
    });

    const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const fileName = `${["models", slug(catLabel), slug(brandLabel)].filter(Boolean).join("-")}.xlsx`;

    exportModelsWorkbook(sheets, fileName)
      .then(() => toast.success("Downloaded — existing models included; add new ones and upload"))
      .catch(() => toast.error("Export failed"));
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setImporting(true);
    try {
      const parsed = await parseModelsWorkbook(file);
      if (parsed.length === 0) {
        toast.error("No model rows found in the file");
        return;
      }

      // Existing models (brand + name) so re-uploaded old data is skipped, not
      // re-created or reported as an error.
      const existsKey = (brandId: string, name: string) => `${brandId}::${name.trim().toLowerCase()}`;
      const existing = new Set(data.map((r) => existsKey(String(r.brandId), r.name)));

      let created = 0;
      let skippedExisting = 0;
      const errors: string[] = [];
      for (const row of parsed) {
        const brandId = brandIdByName.get(row.brand.trim().toLowerCase());
        const categoryId = row.category ? categoryIdByName.get(row.category.trim().toLowerCase()) : undefined;

        if (!row.brand) {
          errors.push(`"${row.name}": brand is required`);
          continue;
        }
        if (!brandId) {
          errors.push(`"${row.name}": unknown brand "${row.brand}"`);
          continue;
        }
        if (row.category && !categoryId) {
          errors.push(`"${row.name}": unknown category "${row.category}"`);
          continue;
        }
        if (existing.has(existsKey(brandId, row.name))) {
          skippedExisting += 1;
          continue;
        }
        try {
          await modelsService.create({
            categoryId,
            brandId,
            name: row.name,
            modelNumber: row.modelNumber || undefined,
            isActive: row.active,
          });
          existing.add(existsKey(brandId, row.name));
          created += 1;
        } catch (e) {
          errors.push(`"${row.name}": ${extractErrorMessage(e, "save failed")}`);
        }
      }

      invalidate();
      if (created > 0) {
        toast.success(
          `Imported ${created} model(s)${skippedExisting ? ` · ${skippedExisting} already existed` : ""}`
        );
      } else if (skippedExisting > 0 && errors.length === 0) {
        toast.success(`Nothing new — ${skippedExisting} model(s) already exist`);
      }
      if (errors.length > 0) {
        toast.error(`${errors.length} row(s) skipped — see console for details`);
        console.warn(`Model import — ${errors.length} skipped:\n${errors.join("\n")}`);
      }
    } catch (e) {
      toast.error(extractErrorMessage(e, "Could not read the file"));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <CrudManagementPage<ProductModel>
      title="Models"
      description="Select a category, pick a mapped brand, then add the model name and number."
      rows={data}
      searchKeys={["name", "brandName", "modelNumber"]}
      headerActions={
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
          <Select
            value={downloadCategoryId}
            onValueChange={(v) => {
              setDownloadCategoryId(v);
              setDownloadBrandId("all"); // brands depend on category — reset on change
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All Categories</SelectItem>
              {downloadCategoryOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={downloadBrandId} onValueChange={setDownloadBrandId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All Brands</SelectItem>
              {downloadBrandOptions.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={handleDownload}>
            <Download className="h-4 w-4" /> Download Excel
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload Excel
          </Button>
        </>
      }
      columns={[
        { key: "name", header: "Model", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "categoryId", header: "Category", render: (r) => categoryName(r.categoryId) },
        { key: "brandName", header: "Brand", render: (r) => brandName(r) },
        { key: "modelNumber", header: "Model Number" },
      ]}
      formTitle="Model"
      formContent={(record, close) => <ModelForm record={record} onSaved={invalidate} close={close} />}
      viewContent={(r) => (
        <>
          <InfoRow label="Name" value={r.name} />
          <InfoRow label="Category" value={categoryName(r.categoryId)} />
          <InfoRow label="Brand" value={brandName(r)} />
          <InfoRow label="Model Number" value={r.modelNumber} />
        </>
      )}
      onDelete={async (r) => {
        await modelsService.remove(r.id);
        invalidate();
      }}
      onToggleStatus={async (r) => {
        await modelsService.toggleStatus(r.id, !r.isActive);
        invalidate();
      }}
    />
  );
}
