"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ImagePreview } from "@/components/common/ImagePreview";
import { FileUpload } from "@/components/common/FileUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { productsService } from "@/services/products.service";
import { brandsService, categoriesService, modelsService, productTypesService, subCategoriesService } from "@/services/catalog.service";
import type { Product } from "@/types/product.types";

const productSchema = z.object({
  itemName: z.string().min(2),
  sku: z.string().min(2),
  categoryId: z.coerce.number().optional(),
  subCategoryId: z.coerce.number().optional(),
  productTypeId: z.coerce.number().optional(),
  brandId: z.coerce.number().optional(),
  modelId: z.coerce.number().optional(),
  images: z.array(z.string()).optional(),
  description: z.string().optional(),
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  isActiveGlobal: z.boolean().optional(),
});
type Values = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["products"], queryFn: () => productsService.list() });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });
  const { data: subCategories = [] } = useQuery({ queryKey: ["sub-categories"], queryFn: subCategoriesService.list });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: brandsService.list });
  const { data: models = [] } = useQuery({ queryKey: ["models"], queryFn: modelsService.list });
  const { data: productTypes = [] } = useQuery({ queryKey: ["product-types"], queryFn: productTypesService.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["products"] });

  return (
    <CrudManagementPage<Product>
      title="Products"
      description="Master catalog of products across the platform."
      rows={data}
      searchKeys={["itemName", "sku", "brandName", "categoryName"]}
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
        { key: "itemName", header: "Item Name", render: (r) => <span className="font-medium">{r.itemName}</span> },
        { key: "sku", header: "SKU" },
        { key: "categoryName", header: "Category" },
        { key: "brandName", header: "Brand" },
        {
          key: "approvalStatus",
          header: "Approval",
          render: (r) => <StatusBadge status={r.approvalStatus} />,
        },
      ]}
      showStatus={false}
      formTitle="Product"
      formContent={(record, close) => (
        <ProductForm
          product={record}
          categories={categories}
          subCategories={subCategories}
          brands={brands}
          models={models}
          productTypes={productTypes}
          onSaved={() => {
            invalidate();
            close();
          }}
          onCancel={close}
        />
      )}
      viewContent={(r) => (
        <>
          <div className="flex gap-4 mb-3">
            <div className="h-32 w-32">
              <ImagePreview src={r.images?.[0]} alt={r.itemName} className="h-full w-full" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-semibold">{r.itemName}</h3>
              <StatusBadge status={r.approvalStatus} />
            </div>
          </div>
          <InfoRow label="SKU" value={r.sku} />
          <InfoRow label="Category" value={r.categoryName} />
          <InfoRow label="Sub Category" value={r.subCategoryName} />
          <InfoRow label="Brand" value={r.brandName} />
          <InfoRow label="Model" value={r.modelName} />
          <InfoRow label="Active" value={r.isActiveGlobal ? "Yes" : "No"} />
        </>
      )}
      onDelete={async (r) => {
        await productsService.remove(r.id);
        invalidate();
      }}
      customActions={(r) =>
        r.approvalStatus === "PENDING" ? (
          <>
            <Button
              size="sm"
              variant="success"
              onClick={async () => {
                await productsService.approve(r.id);
                toast.success("Approved");
                invalidate();
              }}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                await productsService.reject(r.id);
                toast.success("Rejected");
                invalidate();
              }}
            >
              Reject
            </Button>
          </>
        ) : null
      }
    />
  );
}

function ProductForm({
  product,
  categories,
  subCategories,
  brands,
  models,
  productTypes,
  onSaved,
  onCancel,
}: {
  product: Product | null;
  categories: { id: number | string; name: string }[];
  subCategories: { id: number | string; name: string; categoryId: number | string }[];
  brands: { id: number | string; name: string }[];
  models: { id: number | string; name: string }[];
  productTypes: { id: number | string; name: string }[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      itemName: product?.itemName ?? "",
      sku: product?.sku ?? "",
      categoryId: product?.categoryId as number | undefined,
      subCategoryId: product?.subCategoryId as number | undefined,
      productTypeId: product?.productTypeId as number | undefined,
      brandId: product?.brandId as number | undefined,
      modelId: product?.modelId as number | undefined,
      images: product?.images ?? [],
      description: "",
      approvalStatus: product?.approvalStatus ?? "PENDING",
      isActiveGlobal: product?.isActiveGlobal ?? true,
    },
  });
  const [images, setImages] = useState<string[]>(product?.images ?? []);

  const handle = async (values: Values) => {
    try {
      const payload = { ...values, images };
      if (product) await productsService.update(product.id, payload);
      else await productsService.create(payload);
      toast.success("Saved");
      onSaved();
    } catch {
      toast.error("Could not save");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handle)} className="space-y-4">
      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="category">Category</TabsTrigger>
          <TabsTrigger value="compat">Compat</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="dynamic">Dynamic</TabsTrigger>
          <TabsTrigger value="approval">Approval</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Item Name</Label>
              <Input {...form.register("itemName")} />
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input {...form.register("sku")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Textarea {...form.register("description")} rows={4} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="media">
          <FileUpload value={images} onChange={setImages} />
        </TabsContent>

        <TabsContent value="category" className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Category" value={form.watch("categoryId")} options={categories.map((c) => ({ label: c.name, value: c.id as number }))} onChange={(v) => form.setValue("categoryId", v as number)} />
            <SelectField label="Sub Category" value={form.watch("subCategoryId")} options={subCategories.map((c) => ({ label: c.name, value: c.id as number }))} onChange={(v) => form.setValue("subCategoryId", v as number)} />
            <SelectField label="Product Type" value={form.watch("productTypeId")} options={productTypes.map((c) => ({ label: c.name, value: c.id as number }))} onChange={(v) => form.setValue("productTypeId", v as number)} />
            <SelectField label="Brand" value={form.watch("brandId")} options={brands.map((c) => ({ label: c.name, value: c.id as number }))} onChange={(v) => form.setValue("brandId", v as number)} />
            <SelectField label="Model" value={form.watch("modelId")} options={models.map((c) => ({ label: c.name, value: c.id as number }))} onChange={(v) => form.setValue("modelId", v as number)} />
          </div>
        </TabsContent>

        <TabsContent value="compat">
          <p className="text-sm text-muted-foreground">Manage compatible brands & models in the Product Compatibility page.</p>
        </TabsContent>

        <TabsContent value="variants">
          <p className="text-sm text-muted-foreground">Variants editor — combine attributes from Product Attributes page. (Inline editor coming via API.)</p>
        </TabsContent>

        <TabsContent value="info">
          <p className="text-sm text-muted-foreground">Add key-value product information specs via API integration.</p>
        </TabsContent>

        <TabsContent value="dynamic">
          <p className="text-sm text-muted-foreground">Dynamic schema fields can be defined per product type.</p>
        </TabsContent>

        <TabsContent value="approval" className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Approval Status"
              value={form.watch("approvalStatus")}
              options={[
                { label: "Pending", value: "PENDING" },
                { label: "Approved", value: "APPROVED" },
                { label: "Rejected", value: "REJECTED" },
              ]}
              onChange={(v) => form.setValue("approvalStatus", v as Values["approvalStatus"])}
            />
            <div className="flex items-center gap-2 pt-7">
              <Checkbox checked={form.watch("isActiveGlobal")} onCheckedChange={(v) => form.setValue("isActiveGlobal", Boolean(v))} />
              <Label>Active globally</Label>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Product
        </Button>
      </div>
    </form>
  );
}

function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value !== undefined ? String(value) : ""} onValueChange={(v) => onChange((typeof options[0]?.value === "number" ? Number(v) : v) as T)}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={String(o.value)} value={String(o.value)}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
