"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { stockTransfersService } from "@/services/stockTransfers.service";
import { shopsService } from "@/services/shops.service";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { StockTransfer } from "@/types/inventory.types";

const schema = z.object({
  fromShopId: z.coerce.number().min(1),
  toShopId: z.coerce.number().min(1),
  transferType: z.enum(["FORWARD", "REVERSE"]),
  notes: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export default function StockTransfersPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["transfers"], queryFn: stockTransfersService.list });
  const { data: shops = [] } = useQuery({ queryKey: ["shops"], queryFn: shopsService.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["transfers"] });

  return (
    <CrudManagementPage<StockTransfer & { isActive?: boolean }>
      title="Stock Transfers"
      description="Transfer stock between Main and Branch shops. FORWARD = Main → Branch · REVERSE = Branch → Main"
      rows={data}
      searchKeys={["fromShopName", "toShopName"]}
      columns={[
        { key: "id", header: "ID" },
        { key: "fromShopName", header: "From" },
        { key: "toShopName", header: "To" },
        { key: "transferType", header: "Type" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
      ]}
      showStatus={false}
      formTitle="Stock Transfer"
      formContent={(record, close) => (
        <GenericForm<Values>
          schema={schema}
          defaultValues={{
            fromShopId: (record?.fromShopId as number) ?? (shops[0]?.id as number),
            toShopId: (record?.toShopId as number) ?? (shops[1]?.id as number),
            transferType: record?.transferType ?? "FORWARD",
            notes: record?.notes ?? "",
          }}
          fields={[
            { name: "fromShopId", label: "From Shop", type: "select", options: shops.map((s) => ({ label: s.shopName, value: s.id as number })) },
            { name: "toShopId", label: "To Shop", type: "select", options: shops.map((s) => ({ label: s.shopName, value: s.id as number })) },
            {
              name: "transferType",
              label: "Type",
              type: "select",
              options: [
                { label: "Forward (Main → Branch)", value: "FORWARD" },
                { label: "Reverse (Branch → Main)", value: "REVERSE" },
              ],
            },
            { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
          ]}
          onSubmit={async (values) => {
            if (record) await stockTransfersService.create({ ...values });
            else await stockTransfersService.create(values);
            invalidate();
          }}
          onCancel={close}
        />
      )}
      viewContent={(r) => (
        <>
          <InfoRow label="From" value={r.fromShopName} />
          <InfoRow label="To" value={r.toShopName} />
          <InfoRow label="Type" value={r.transferType} />
          <InfoRow label="Status" value={<StatusBadge status={r.status} />} />
          <InfoRow label="Date" value={formatDate(r.createdAt)} />
        </>
      )}
    />
  );
}
