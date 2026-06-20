"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { productAttributesService } from "@/services/catalog.service";
import type { ProductAttribute } from "@/types/catalog.types";
import { Badge } from "@/components/ui/badge";

const schema = z.object({
  name: z.string().min(2),
  valuesCsv: z.string().min(1, "Enter comma-separated values"),
  isActive: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

export default function ProductAttributesPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["attributes"], queryFn: productAttributesService.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["attributes"] });

  return (
    <CrudManagementPage<ProductAttribute>
      title="Product Attributes"
      description="Define attribute names and their possible values."
      rows={data}
      searchKeys={["name"]}
      columns={[
        { key: "name", header: "Attribute", render: (r) => <span className="font-medium">{r.name}</span> },
        {
          key: "values",
          header: "Values",
          render: (r) => (
            <div className="flex flex-wrap gap-1">
              {r.values.map((v) => (
                <Badge key={v} variant="secondary" className="text-xs">
                  {v}
                </Badge>
              ))}
            </div>
          ),
        },
      ]}
      formTitle="Attribute"
      formContent={(record, close) => (
        <GenericForm<Values>
          schema={schema}
          defaultValues={{
            name: record?.name ?? "",
            valuesCsv: (record?.values ?? []).join(", "),
            isActive: record?.isActive ?? true,
          }}
          fields={[
            { name: "name", label: "Name" },
            { name: "valuesCsv", label: "Values (comma separated)", colSpan: 2 },
            { name: "isActive", label: "Active", type: "switch" },
          ]}
          onSubmit={async (values) => {
            const payload = { name: values.name, values: values.valuesCsv.split(",").map((v) => v.trim()).filter(Boolean), isActive: values.isActive };
            if (record) await productAttributesService.update(record.id, payload);
            else await productAttributesService.create(payload);
            invalidate();
          }}
          onCancel={close}
        />
      )}
      viewContent={(r) => (
        <>
          <InfoRow label="Name" value={r.name} />
          <InfoRow label="Values" value={r.values.join(", ")} />
        </>
      )}
      onDelete={async (r) => {
        await productAttributesService.remove(r.id);
        invalidate();
      }}
      onToggleStatus={async (r) => {
        await productAttributesService.toggleStatus(r.id, !r.isActive);
        invalidate();
      }}
    />
  );
}
