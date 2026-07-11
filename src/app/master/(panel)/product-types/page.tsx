"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { productTypesService, subCategoriesService } from "@/services/catalog.service";
import type { ProductType } from "@/types/catalog.types";

const schema = z.object({
  subCategoryId: z.string().min(1, "Sub category is required"),
  name: z.string().min(2),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

export default function ProductTypesPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["product-types"], queryFn: productTypesService.list });
  const { data: subCategories = [] } = useQuery({
    queryKey: ["sub-categories"],
    queryFn: subCategoriesService.list,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["product-types"] });

  const subCategoryLabel = useMemo(() => {
    const map = new Map(subCategories.map((s) => [String(s.id), s.name]));
    return (id?: ProductType["subCategoryId"]) => (id != null ? map.get(String(id)) ?? "—" : "—");
  }, [subCategories]);

  return (
    <CrudManagementPage<ProductType>
      title="Product Types"
      description="Define product type classifications."
      rows={data}
      searchKeys={["name"]}
      columns={[
        {
          key: "imageUrl",
          header: "Image",
          className: "w-16",
          render: (r) =>
            r.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.imageUrl} alt={r.name} className="h-10 w-10 rounded object-cover" />
            ) : (
              <div className="h-10 w-10 rounded bg-muted" />
            ),
        },
        { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "subCategoryId", header: "Sub Category", render: (r) => subCategoryLabel(r.subCategoryId) },
      ]}
      formTitle="Product Type"
      formContent={(record, close) => (
        <GenericForm<Values>
          schema={schema}
          defaultValues={{
            subCategoryId:
              record?.subCategoryId != null
                ? String(record.subCategoryId)
                : subCategories[0]?.id != null
                ? String(subCategories[0].id)
                : "",
            name: record?.name ?? "",
            imageUrl: record?.imageUrl ?? "",
            isActive: record?.isActive ?? true,
          }}
          fields={[
            {
              name: "subCategoryId",
              label: "Sub Category",
              type: "select",
              options: subCategories.map((s) => ({ label: s.name, value: String(s.id) })),
            },
            { name: "name", label: "Name" },
            {
              name: "imageUrl",
              label: "Image",
              type: "image",
              uploadFolder: "catalog/product-types",
              colSpan: 2,
            },
            { name: "isActive", label: "Active", type: "switch" },
          ]}
          onSubmit={async (values) => {
            if (record) await productTypesService.update(record.id, values);
            else await productTypesService.create(values);
            invalidate();
          }}
          onCancel={close}
        />
      )}
      viewContent={(r) => (
        <>
          {r.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.imageUrl} alt={r.name} className="mb-2 h-24 w-24 rounded object-cover" />
          )}
          <InfoRow label="Name" value={r.name} />
          <InfoRow label="Sub Category" value={subCategoryLabel(r.subCategoryId)} />
        </>
      )}
      onDelete={async (r) => {
        await productTypesService.remove(r.id);
        invalidate();
      }}
      onToggleStatus={async (r) => {
        await productTypesService.toggleStatus(r.id, !r.isActive);
        invalidate();
      }}
    />
  );
}
