"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { brandsService } from "@/services/catalog.service";
import type { Brand } from "@/types/catalog.types";

const schema = z.object({
  name: z.string().min(2),
  logoUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

export default function BrandsPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["brands"], queryFn: brandsService.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["brands"] });

  return (
    <CrudManagementPage<Brand>
      title="Brands"
      description="Manage manufacturer and product brands."
      rows={data}
      searchKeys={["name"]}
      columns={[
        {
          key: "logoUrl",
          header: "Logo",
          className: "w-16",
          render: (r) =>
            r.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.logoUrl}
                alt={r.name}
                className="h-10 w-10 rounded object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded bg-muted" />
            ),
        },
        { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
      ]}
      formTitle="Brand"
      formContent={(record, close) => (
        <GenericForm<Values>
          schema={schema}
          defaultValues={{
            name: record?.name ?? "",
            logoUrl: record?.logoUrl ?? "",
            isActive: record?.isActive ?? true,
          }}
          fields={[
            { name: "name", label: "Name" },
            {
              name: "logoUrl",
              label: "Logo",
              type: "image",
              uploadFolder: "catalog/brands",
              colSpan: 2,
            },
            { name: "isActive", label: "Active", type: "switch" },
          ]}
          onSubmit={async (values) => {
            if (record) await brandsService.update(record.id, values);
            else await brandsService.create(values);
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
        await brandsService.remove(r.id);
        invalidate();
      }}
      onToggleStatus={async (r) => {
        await brandsService.toggleStatus(r.id, !r.isActive);
        invalidate();
      }}
    />
  );
}
