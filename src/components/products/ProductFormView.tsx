"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploadField } from "@/components/common/ImageUploadField";
import {
  VariationsBuilder,
  buildSku,
  fromVariantPayload,
  toVariantPayload,
  type VariationsState,
} from "@/components/products/VariationsBuilder";
import { productsService } from "@/services/products.service";
import {
  categoriesService,
  modelsService,
  productTypesService,
  subCategoriesService,
} from "@/services/catalog.service";
import { categoryBrandsService } from "@/services/category-brands.service";
import { attributeTemplatesService } from "@/services/attribute-templates.service";
import { routes } from "@/lib/routes";
import type { Product } from "@/types/product.types";
import type { TemplateField, TemplateSection } from "@/types/attribute-template.types";

type Option = { id: number | string; name: string };
type SubOption = Option & { categoryId: number | string };
type TypeOption = Option & { subCategoryId?: number | string };

const idStr = (v: unknown) => (v != null && v !== "" ? String(v) : "");

export function ProductFormView({ productId }: { productId?: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const goBack = () => router.push(routes.superAdmin.products);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });
  const { data: subCategories = [] } = useQuery({ queryKey: ["sub-categories"], queryFn: subCategoriesService.list });
  const { data: productTypes = [] } = useQuery({ queryKey: ["product-types"], queryFn: productTypesService.list });
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsService.get(productId!),
    enabled: Boolean(productId),
  });

  if (productId && isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading product…
      </div>
    );
  }

  return (
    <ProductFormInner
      key={product?.id ?? "new"}
      product={product ?? null}
      categories={categories}
      subCategories={subCategories as SubOption[]}
      productTypes={productTypes as TypeOption[]}
      onSaved={() => {
        qc.invalidateQueries({ queryKey: ["products"] });
        goBack();
      }}
      onCancel={goBack}
    />
  );
}

function ProductFormInner({
  product,
  categories,
  subCategories,
  productTypes,
  onSaved,
  onCancel,
}: {
  product: Product | null;
  categories: Option[];
  subCategories: SubOption[];
  productTypes: TypeOption[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [categoryId, setCategoryId] = useState(idStr(product?.categoryId));
  const [subCategoryId, setSubCategoryId] = useState(idStr(product?.subCategoryId));
  const [productTypeId, setProductTypeId] = useState(idStr(product?.productTypeId));
  const [brandId, setBrandId] = useState(idStr(product?.brandId));
  const [modelId, setModelId] = useState(idStr(product?.modelId));
  const [tab, setTab] = useState("category");
  const [dynamicValues, setDynamicValues] = useState<Record<string, unknown>>(
    (product?.dynamicFields as Record<string, unknown>) ?? {}
  );
  const [variations, setVariations] = useState<VariationsState>(() => fromVariantPayload(product?.variant));
  const [saving, setSaving] = useState(false);
  const setDyn = (key: string, v: unknown) => setDynamicValues((prev) => ({ ...prev, [key]: v }));

  const subOptions = useMemo(
    () => subCategories.filter((s) => String(s.categoryId) === categoryId),
    [subCategories, categoryId]
  );
  const typeOptions = useMemo(
    () => productTypes.filter((p) => p.subCategoryId == null || String(p.subCategoryId) === subCategoryId),
    [productTypes, subCategoryId]
  );

  // Brands mapped to the chosen category, and models for the chosen brand.
  const { data: brandMappings = [] } = useQuery({
    queryKey: ["cb-brands", categoryId],
    queryFn: () => categoryBrandsService.list(categoryId),
    enabled: Boolean(categoryId),
  });
  const brandOptions = useMemo(
    () => brandMappings.map((m) => ({ label: m.brandName ?? String(m.brandId), value: String(m.brandId) })),
    [brandMappings]
  );
  const { data: allModels = [] } = useQuery({ queryKey: ["models"], queryFn: modelsService.list });
  const modelOptions = useMemo(
    () =>
      allModels
        .filter((m) => String(m.brandId) === brandId)
        .map((m) => ({ label: m.name, value: String(m.id) })),
    [allModels, brandId]
  );
  // Model number is a property of the selected model — shown read-only.
  const selectedModelNumber = useMemo(
    () => allModels.find((m) => String(m.id) === modelId)?.modelNumber ?? "",
    [allModels, modelId]
  );

  // Auto SKU for Product Details: model number + the product's colour code + INS
  // (same rule as the variant SKUs). Recomputes when model or colour changes.
  const autoSku = useMemo(() => {
    const colorKey = Object.keys(dynamicValues).find((k) => /colou?r/i.test(k) && k !== "sku");
    const color = colorKey ? String(dynamicValues[colorKey] ?? "") : "";
    return buildSku(selectedModelNumber, color);
  }, [selectedModelNumber, dynamicValues]);

  useEffect(() => {
    if (!selectedModelNumber || !autoSku) return;
    setDynamicValues((prev) => {
      const cur = String(prev.sku ?? "").trim();
      // Only overwrite an empty or previously auto-generated SKU — keep manual edits.
      const isAuto =
        cur === "" ||
        cur === selectedModelNumber ||
        (cur.startsWith(selectedModelNumber) && cur.endsWith("INS"));
      return !isAuto || cur === autoSku ? prev : { ...prev, sku: autoSku };
    });
  }, [autoSku, selectedModelNumber]);

  const ready = Boolean(categoryId && subCategoryId && productTypeId);
  const { data: template, isFetching: loadingTemplate } = useQuery({
    queryKey: ["attr-template", categoryId, subCategoryId, productTypeId],
    queryFn: () => attributeTemplatesService.getBySelection(categoryId, subCategoryId, productTypeId),
    enabled: ready,
  });
  const sections = (template?.sections ?? []).filter((s) => s.active !== false);
  // Ordered tab keys for the Next/Back wizard navigation.
  const tabValues = ["category", ...sections.map((_, i) => `sec-${i}`)];
  const variationsSection = sections.find((s) => /variation/i.test(s.headingName));
  const variationFields = (variationsSection?.groups ?? [])
    .flatMap((g) => (g.fields ?? []).filter((f) => f.active !== false))
    .map((f) => ({ key: f.key, label: f.label }));

  const save = async () => {
    if (!ready) return toast.error("Select category, sub category and product type");
    const itemName = String(dynamicValues.itemname ?? dynamicValues.itemName ?? "").trim();
    if (!itemName) return toast.error("Enter Item Name (Product Details → Basic Info)");

    // Collect image URLs from any file/image fields for the product gallery.
    const imageUrls: string[] = [];
    for (const s of sections)
      for (const g of s.groups ?? [])
        for (const f of g.fields ?? [])
          if (f.inputType === "file" || f.inputType === "image") {
            const v = dynamicValues[f.key];
            if (v) imageUrls.push(String(v));
          }

    const payload = {
      itemName,
      sku:
        (dynamicValues.sku ? String(dynamicValues.sku).trim() : "") ||
        selectedModelNumber ||
        undefined,
      categoryId,
      subCategoryId,
      productTypeId,
      brandId: brandId || undefined,
      modelId: modelId || undefined,
      images: imageUrls,
      dynamicFieldValues: dynamicValues,
      variant: toVariantPayload(variationFields, variations, selectedModelNumber),
      approvalStatus: product?.approvalStatus ?? "PENDING",
      isActiveGlobal: product?.isActiveGlobal ?? true,
    };

    try {
      setSaving(true);
      if (product) await productsService.update(product.id, payload);
      else await productsService.create(payload);
      toast.success("Product saved");
      onSaved();
    } catch {
      toast.error("Could not save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="icon" onClick={onCancel} aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{product ? "Edit Product" : "Add Product"}</h1>
            <p className="text-sm text-muted-foreground">
              Pick the category, then fill the product-type attribute sections.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Product
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="category">Category</TabsTrigger>
            {sections.map((s, i) => (
              <TabsTrigger key={`${s.headingName}-${i}`} value={`sec-${i}`}>
                {s.headingName}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="category" className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <SelectField
                label="Category"
                required
                value={categoryId}
                options={categories.map((c) => ({ label: c.name, value: String(c.id) }))}
                onChange={(v) => {
                  setCategoryId(v);
                  setSubCategoryId("");
                  setProductTypeId("");
                }}
              />
              <SelectField
                label="Sub Category"
                required
                disabled={!categoryId}
                value={subCategoryId}
                options={subOptions.map((c) => ({ label: c.name, value: String(c.id) }))}
                onChange={(v) => {
                  setSubCategoryId(v);
                  setProductTypeId("");
                }}
              />
              <SelectField
                label="Product Type"
                required
                disabled={!subCategoryId}
                value={productTypeId}
                options={typeOptions.map((c) => ({ label: c.name, value: String(c.id) }))}
                onChange={setProductTypeId}
              />
              <SelectField
                label="Brand"
                disabled={!categoryId}
                value={brandId}
                options={brandOptions}
                onChange={(v) => {
                  setBrandId(v);
                  setModelId("");
                }}
              />
              <SelectField
                label="Model Name"
                disabled={!brandId}
                value={modelId}
                options={modelOptions}
                onChange={setModelId}
              />
              <div className="space-y-1.5">
                <Label>Model Number</Label>
                <Input
                  value={selectedModelNumber}
                  disabled
                  placeholder={modelId ? "—" : "Select a model first"}
                />
              </div>
            </div>
            {!ready && (
              <p className="text-sm text-muted-foreground">
                Select category, sub category and product type to load the attribute sections.
              </p>
            )}

            <WizardNav tabs={tabValues} current="category" onNavigate={setTab} nextDisabled={!ready} />
          </TabsContent>

          {sections.map((section, i) => (
            <TabsContent key={`${section.headingName}-${i}`} value={`sec-${i}`} className="space-y-4">
              {/variation/i.test(section.headingName) ? (
                <VariationsBuilder
                  fields={variationFields}
                  value={variations}
                  onChange={setVariations}
                  baseSku={selectedModelNumber}
                />
              ) : (
                <SectionFields section={section} values={dynamicValues} onChange={setDyn} />
              )}
              <WizardNav
                tabs={tabValues}
                current={`sec-${i}`}
                onNavigate={setTab}
                onFinish={i === sections.length - 1 ? save : undefined}
                finishing={saving}
              />
            </TabsContent>
          ))}

          {ready && loadingTemplate && (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading attribute sections…</p>
          )}
          {ready && !loadingTemplate && sections.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No attribute template for this selection. Build one in Product Attributes.
            </p>
          )}
        </Tabs>
      </div>
    </div>
  );
}

/** Back / Next (or Save on the last tab) footer used to step through the tabs. */
function WizardNav({
  tabs,
  current,
  onNavigate,
  nextDisabled,
  onFinish,
  finishing,
}: {
  tabs: string[];
  current: string;
  onNavigate: (v: string) => void;
  nextDisabled?: boolean;
  onFinish?: () => void;
  finishing?: boolean;
}) {
  const idx = tabs.indexOf(current);
  const prev = idx > 0 ? tabs[idx - 1] : null;
  const next = idx >= 0 && idx < tabs.length - 1 ? tabs[idx + 1] : null;

  return (
    <div className="flex items-center justify-between border-t pt-4">
      {prev ? (
        <Button type="button" variant="outline" onClick={() => onNavigate(prev)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
      ) : (
        <span />
      )}
      {next ? (
        <Button type="button" onClick={() => onNavigate(next)} disabled={nextDisabled}>
          Next <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      ) : onFinish ? (
        <Button type="button" onClick={onFinish} disabled={finishing}>
          {finishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Product
        </Button>
      ) : (
        <span />
      )}
    </div>
  );
}

function SectionFields({
  section,
  values,
  onChange,
}: {
  section: TemplateSection;
  values: Record<string, unknown>;
  onChange: (key: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      {(section.groups ?? [])
        .filter((g) => g.active !== false)
        .map((group) => (
          <div key={group.groupName} className="rounded-md border">
            <div className="border-b bg-muted/40 px-3 py-2 text-sm font-semibold">{group.groupName}</div>
            <div className="grid gap-3 p-3 sm:grid-cols-2">
              {(group.fields ?? [])
                .filter((f) => f.active !== false)
                .map((field) => (
                  <DynamicField key={field.key} field={field} value={values[field.key]} onChange={(v) => onChange(field.key, v)} />
                ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: TemplateField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const labelEl = (
    <Label className="text-xs">
      {field.label}
      {field.required && <span className="text-destructive"> *</span>}
    </Label>
  );
  const wrap = (child: ReactNode, full?: boolean) => (
    <div className={`space-y-1 ${full ? "sm:col-span-2" : ""}`}>
      {labelEl}
      {child}
    </div>
  );

  if (field.inputType === "file" || field.inputType === "image") {
    return wrap(<ImageUploadField value={String(value ?? "")} onChange={onChange} />);
  }
  if (field.inputType === "textarea") {
    return wrap(
      <textarea
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={field.placeholder}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      />,
      true
    );
  }
  if (field.inputType === "boolean") {
    return (
      <div className="flex items-center gap-2 pt-5">
        <Checkbox checked={Boolean(value)} onCheckedChange={(v) => onChange(Boolean(v))} />
        <Label className="text-xs">{field.label}</Label>
      </div>
    );
  }
  if (field.inputType === "select" || field.inputType === "radio") {
    return wrap(
      <Select value={value != null ? String(value) : ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {(field.options ?? []).map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (field.inputType === "multiSelect") {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    return wrap(
      <div className="flex flex-wrap gap-3 rounded-md border p-2">
        {(field.options ?? []).map((o) => {
          const checked = arr.includes(o);
          return (
            <label key={o} className="flex cursor-pointer items-center gap-1.5 text-xs">
              <Checkbox
                checked={checked}
                onCheckedChange={() => onChange(checked ? arr.filter((x) => x !== o) : [...arr, o])}
              />
              {o}
            </label>
          );
        })}
      </div>,
      true
    );
  }

  const inputType = field.inputType === "number" ? "number" : field.inputType === "date" ? "date" : "text";
  return wrap(
    <Input
      type={inputType}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
    />
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  required,
  disabled,
}: {
  label: string;
  value?: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Select value={value ?? ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
