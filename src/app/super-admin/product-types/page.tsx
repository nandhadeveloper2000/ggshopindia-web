"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { productTypesService } from "@/services/catalog.service";
import type { ProductType } from "@/types/catalog.types";

const schema = z.object({
  name: z.string().min(2),
  isActive: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

export default function ProductTypesPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["product-types"], queryFn: productTypesService.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["product-types"] });

  return (
    <CrudManagementPage<ProductType>
      title="Product Types"
      description="Define product type classifications."
      rows={data}
      searchKeys={["name"]}
      columns={[
        { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
      ]}
      formTitle="Product Type"
      formContent={(record, close) => (
        <GenericForm<Values>
          schema={schema}
          defaultValues={{
            name: record?.name ?? "",
            isActive: record?.isActive ?? true,
          }}
          fields={[
            { name: "name", label: "Name" },
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
          <InfoRow label="Name" value={r.name} />
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
