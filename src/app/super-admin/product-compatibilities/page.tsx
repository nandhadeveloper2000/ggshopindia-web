"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { brandsService, modelsService, productCompatibilitiesService } from "@/services/catalog.service";
import { productsService } from "@/services/products.service";
import type { ProductCompatibility } from "@/types/catalog.types";

const schema = z.object({
  productId: z.coerce.number().min(1),
  brandId: z.coerce.number().min(1),
  modelId: z.coerce.number().min(1),
});
type Values = z.infer<typeof schema>;

export default function ProductCompatibilitiesPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["compatibilities"], queryFn: productCompatibilitiesService.list });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => productsService.list() });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: brandsService.list });
  const { data: models = [] } = useQuery({ queryKey: ["models"], queryFn: modelsService.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["compatibilities"] });

  return (
    <CrudManagementPage<ProductCompatibility & { isActive?: boolean }>
      title="Product Compatibility"
      description="Map products to compatible brands and models."
      rows={data}
      searchKeys={[]}
      columns={[
        { key: "productId", header: "Product", render: (r) => products.find((p) => p.id === r.productId)?.itemName ?? r.productId },
        { key: "brandId", header: "Brand", render: (r) => brands.find((b) => b.id === r.brandId)?.name ?? r.brandId },
        { key: "modelId", header: "Model", render: (r) => models.find((m) => m.id === r.modelId)?.name ?? r.modelId },
      ]}
      showStatus={false}
      formTitle="Compatibility"
      formContent={(record, close) => (
        <GenericForm<Values>
          schema={schema}
          defaultValues={{
            productId: (record?.productId as number) ?? (products[0]?.id as number),
            brandId: (record?.brandId as number) ?? (brands[0]?.id as number),
            modelId: (record?.modelId as number) ?? (models[0]?.id as number),
          }}
          fields={[
            { name: "productId", label: "Product", type: "select", options: products.map((p) => ({ label: p.itemName, value: p.id as number })) },
            { name: "brandId", label: "Brand", type: "select", options: brands.map((b) => ({ label: b.name, value: b.id as number })) },
            { name: "modelId", label: "Model", type: "select", options: models.map((m) => ({ label: m.name, value: m.id as number })) },
          ]}
          onSubmit={async (values) => {
            if (record) await productCompatibilitiesService.update(record.id, values);
            else await productCompatibilitiesService.create(values);
            invalidate();
          }}
          onCancel={close}
        />
      )}
      viewContent={(r) => (
        <>
          <InfoRow label="Product" value={products.find((p) => p.id === r.productId)?.itemName} />
          <InfoRow label="Brand" value={brands.find((b) => b.id === r.brandId)?.name} />
          <InfoRow label="Model" value={models.find((m) => m.id === r.modelId)?.name} />
        </>
      )}
      onDelete={async (r) => {
        await productCompatibilitiesService.remove(r.id);
        invalidate();
      }}
    />
  );
}
