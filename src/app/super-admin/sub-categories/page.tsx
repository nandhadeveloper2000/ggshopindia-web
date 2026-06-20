"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { categoriesService, subCategoriesService } from "@/services/catalog.service";
import type { SubCategory } from "@/types/catalog.types";

const schema = z.object({
  categoryId: z.string().min(1, "Category required"),
  name: z.string().min(2),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

export default function SubCategoriesPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["sub-categories"], queryFn: subCategoriesService.list });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["sub-categories"] });

  return (
    <CrudManagementPage<SubCategory>
      title="Sub Categories"
      description="Sub-classification within categories."
      rows={data}
      searchKeys={["name", "categoryName"]}
      columns={[
        {
          key: "imageUrl",
          header: "Image",
          className: "w-16",
          render: (r) =>
            r.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.imageUrl}
                alt={r.name}
                className="h-10 w-10 rounded object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded bg-muted" />
            ),
        },
        { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "categoryName", header: "Category" },
      ]}
      formTitle="Sub Category"
      formContent={(record, close) => (
        <GenericForm<Values>
          schema={schema}
          defaultValues={{
            categoryId: record?.categoryId
              ? String(record.categoryId)
              : categories[0]?.id
                ? String(categories[0].id)
                : "",
            name: record?.name ?? "",
            imageUrl: record?.imageUrl ?? "",
            isActive: record?.isActive ?? true,
          }}
          fields={[
            {
              name: "categoryId",
              label: "Category",
              type: "select",
              options: categories.map((c) => ({ label: c.name, value: String(c.id) })),
            },
            { name: "name", label: "Name" },
            {
              name: "imageUrl",
              label: "Image",
              type: "image",
              uploadFolder: "catalog/sub-categories",
              colSpan: 2,
            },
            { name: "isActive", label: "Active", type: "switch" },
          ]}
          onSubmit={async (values) => {
            if (record) await subCategoriesService.update(record.id, values);
            else await subCategoriesService.create(values);
            invalidate();
          }}
          onCancel={close}
        />
      )}
      viewContent={(r) => (
        <>
          <InfoRow label="Name" value={r.name} />
          <InfoRow label="Category" value={r.categoryName} />
        </>
      )}
      onDelete={async (r) => {
        await subCategoriesService.remove(r.id);
        invalidate();
      }}
      onToggleStatus={async (r) => {
        await subCategoriesService.toggleStatus(r.id, !r.isActive);
        invalidate();
      }}
    />
  );
}
