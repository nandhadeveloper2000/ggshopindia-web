"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { vendorsService } from "@/services/vendors.service";
import type { Vendor } from "@/types/vendor.types";

const schema = z.object({
  vendorName: z.string().min(2),
  vendorType: z.enum(["SUPPLIER", "DEALER", "DISTRIBUTOR", "VENDOR"]),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  mobile: z.string().regex(/^[0-9]{10}$/).optional().or(z.literal("")),
  gstNumber: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

export default function VendorsPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["vendors"], queryFn: vendorsService.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["vendors"] });

  return (
    <CrudManagementPage<Vendor>
      title="Vendors"
      description="Suppliers, dealers, and distributors."
      rows={data}
      searchKeys={["vendorName", "contactPerson", "mobile", "email"]}
      columns={[
        { key: "vendorName", header: "Vendor", render: (r) => <span className="font-medium">{r.vendorName}</span> },
        { key: "vendorType", header: "Type" },
        { key: "contactPerson", header: "Contact" },
        { key: "email", header: "Email" },
        { key: "mobile", header: "Mobile" },
        { key: "gstNumber", header: "GST" },
      ]}
      formTitle="Vendor"
      formContent={(record, close) => (
        <GenericForm<Values>
          schema={schema}
          defaultValues={{
            vendorName: record?.vendorName ?? "",
            vendorType: (record?.vendorType as Values["vendorType"]) ?? "SUPPLIER",
            contactPerson: record?.contactPerson ?? "",
            email: record?.email ?? "",
            mobile: record?.mobile ?? "",
            gstNumber: record?.gstNumber ?? "",
            address: record?.address ?? "",
            isActive: record?.isActive ?? true,
          }}
          fields={[
            { name: "vendorName", label: "Vendor Name", colSpan: 2 },
            {
              name: "vendorType",
              label: "Vendor Type",
              type: "select",
              options: [
                { label: "Supplier", value: "SUPPLIER" },
                { label: "Dealer", value: "DEALER" },
                { label: "Distributor", value: "DISTRIBUTOR" },
                { label: "Vendor", value: "VENDOR" },
              ],
            },
            { name: "contactPerson", label: "Contact Person" },
            { name: "email", label: "Email", type: "email" },
            { name: "mobile", label: "Mobile", type: "tel" },
            { name: "gstNumber", label: "GST Number" },
            { name: "address", label: "Address", type: "textarea", colSpan: 2 },
            { name: "isActive", label: "Active", type: "switch" },
          ]}
          onSubmit={async (values) => {
            if (record) await vendorsService.update(record.id, values);
            else await vendorsService.create(values);
            invalidate();
          }}
          onCancel={close}
        />
      )}
      viewContent={(r) => (
        <>
          <InfoRow label="Vendor" value={r.vendorName} />
          <InfoRow label="Type" value={r.vendorType} />
          <InfoRow label="Contact" value={r.contactPerson} />
          <InfoRow label="Email" value={r.email} />
          <InfoRow label="Mobile" value={r.mobile} />
          <InfoRow label="GST" value={r.gstNumber} />
          <InfoRow label="Address" value={r.address} />
        </>
      )}
      onDelete={async (r) => {
        await vendorsService.remove(r.id);
        invalidate();
      }}
      onToggleStatus={async (r) => {
        await vendorsService.toggleStatus(r.id);
        invalidate();
      }}
    />
  );
}
