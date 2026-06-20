"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { brandsService, modelsService } from "@/services/catalog.service";
import type { ProductModel } from "@/types/catalog.types";

const schema = z.object({
  brandId: z.coerce.number().min(1),
  name: z.string().min(2),
  year: z.coerce.number().int().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

export default function ModelsPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["models"], queryFn: modelsService.list });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: brandsService.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["models"] });

  return (
    <CrudManagementPage<ProductModel>
      title="Models"
      description="Models associated to brands."
      rows={data}
      searchKeys={["name", "brandName"]}
      columns={[
        { key: "name", header: "Model", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "brandName", header: "Brand" },
        { key: "year", header: "Year" },
      ]}
      formTitle="Model"
      formContent={(record, close) => (
        <GenericForm<Values>
          schema={schema}
          defaultValues={{
            brandId: (record?.brandId as number) ?? (brands[0]?.id as number),
            name: record?.name ?? "",
            year: record?.year ?? new Date().getFullYear(),
            description: record?.description ?? "",
            isActive: record?.isActive ?? true,
          }}
          fields={[
            { name: "brandId", label: "Brand", type: "select", options: brands.map((b) => ({ label: b.name, value: b.id as number })) },
            { name: "name", label: "Name" },
            { name: "year", label: "Year", type: "number" },
            { name: "description", label: "Description", type: "textarea", colSpan: 2 },
            { name: "isActive", label: "Active", type: "switch" },
          ]}
          onSubmit={async (values) => {
            if (record) await modelsService.update(record.id, values);
            else await modelsService.create(values);
            invalidate();
          }}
          onCancel={close}
        />
      )}
      viewContent={(r) => (
        <>
          <InfoRow label="Name" value={r.name} />
          <InfoRow label="Brand" value={r.brandName} />
          <InfoRow label="Year" value={r.year} />
          <InfoRow label="Description" value={r.description} />
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
