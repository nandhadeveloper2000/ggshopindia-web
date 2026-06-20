"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { customersService } from "@/services/customers.service";
import type { Customer } from "@/types/customer.types";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  mobile: z.string().regex(/^[0-9]{10}$/).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

export default function StaffCustomersPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["customers"], queryFn: customersService.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["customers"] });

  return (
    <CrudManagementPage<Customer>
      title="Customers"
      description="Quick customer lookup and add."
      rows={data}
      searchKeys={["name", "mobile", "email"]}
      columns={[
        { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "mobile", header: "Mobile" },
        { key: "email", header: "Email" },
        { key: "city", header: "City" },
      ]}
      formTitle="Customer"
      formContent={(record, close) => (
        <GenericForm<Values>
          schema={schema}
          defaultValues={{
            name: record?.name ?? "",
            email: record?.email ?? "",
            mobile: record?.mobile ?? "",
            isActive: record?.isActive ?? true,
          }}
          fields={[
            { name: "name", label: "Name", colSpan: 2 },
            { name: "email", label: "Email", type: "email" },
            { name: "mobile", label: "Mobile", type: "tel" },
            { name: "isActive", label: "Active", type: "switch" },
          ]}
          onSubmit={async (values) => {
            if (record) await customersService.update(record.id, values);
            else await customersService.create(values);
            invalidate();
          }}
          onCancel={close}
        />
      )}
      viewContent={(r) => (
        <>
          <InfoRow label="Name" value={r.name} />
          <InfoRow label="Email" value={r.email} />
          <InfoRow label="Mobile" value={r.mobile} />
        </>
      )}
      onDelete={async (r) => {
        await customersService.remove(r.id);
        invalidate();
      }}
    />
  );
}
