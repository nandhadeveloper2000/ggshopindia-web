"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { customersService } from "@/services/customers.service";
import { INDIAN_STATES } from "@/lib/constants";
import type { Customer } from "@/types/customer.types";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  mobile: z.string().regex(/^[0-9]{10}$/).optional().or(z.literal("")),
  gstNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  isActive: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

export default function CustomersPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["customers"], queryFn: customersService.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["customers"] });

  return (
    <CrudManagementPage<Customer>
      title="Customers"
      description="Your shop customers and their contact details."
      rows={data}
      searchKeys={["name", "email", "mobile", "city"]}
      columns={[
        { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "email", header: "Email" },
        { key: "mobile", header: "Mobile" },
        { key: "city", header: "City" },
        { key: "state", header: "State" },
      ]}
      formTitle="Customer"
      formContent={(record, close) => (
        <GenericForm<Values>
          schema={schema}
          defaultValues={{
            name: record?.name ?? "",
            email: record?.email ?? "",
            mobile: record?.mobile ?? "",
            gstNumber: record?.gstNumber ?? "",
            address: record?.address ?? "",
            city: record?.city ?? "",
            state: record?.state ?? "",
            pincode: record?.pincode ?? "",
            isActive: record?.isActive ?? true,
          }}
          fields={[
            { name: "name", label: "Name", colSpan: 2 },
            { name: "email", label: "Email", type: "email" },
            { name: "mobile", label: "Mobile", type: "tel" },
            { name: "gstNumber", label: "GST Number" },
            { name: "city", label: "City" },
            { name: "state", label: "State", type: "select", options: INDIAN_STATES.map((s) => ({ label: s, value: s })) },
            { name: "pincode", label: "Pincode" },
            { name: "address", label: "Address", type: "textarea", colSpan: 2 },
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
          <InfoRow label="City" value={r.city} />
          <InfoRow label="State" value={r.state} />
          <InfoRow label="Address" value={r.address} />
        </>
      )}
      onDelete={async (r) => {
        await customersService.remove(r.id);
        invalidate();
      }}
      onToggleStatus={async (r) => {
        await customersService.toggleStatus(r.id);
        invalidate();
      }}
    />
  );
}
