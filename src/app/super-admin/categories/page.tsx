"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { categoriesService } from "@/services/catalog.service";
import type { Category } from "@/types/catalog.types";

const schema = z.object({
  name: z.string().min(2),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["categories"] });

  return (
    <CrudManagementPage<Category>
      title="Categories"
      description="Master list of product categories."
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
      ]}
      formTitle="Category"
      formContent={(record, close) => (
        <GenericForm<Values>
          schema={schema}
          defaultValues={{
            name: record?.name ?? "",
            imageUrl: record?.imageUrl ?? "",
            isActive: record?.isActive ?? true,
          }}
          fields={[
            { name: "name", label: "Name" },
            {
              name: "imageUrl",
              label: "Image",
              type: "image",
              uploadFolder: "catalog/categories",
              colSpan: 2,
            },
            { name: "isActive", label: "Active", type: "switch" },
          ]}
          onSubmit={async (values) => {
            if (record) await categoriesService.update(record.id, values);
            else await categoriesService.create(values);
            invalidate();
          }}
          onCancel={close}
        />
      )}
      viewContent={(r) => (
        <>
          <InfoRow label="Name" value={r.name} />
        </>
      )}
      onDelete={async (r) => {
        await categoriesService.remove(r.id);
        invalidate();
      }}
      onToggleStatus={async (r) => {
        await categoriesService.toggleStatus(r.id, !r.isActive);
        invalidate();
      }}
    />
  );
}
