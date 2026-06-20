"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { shopsService } from "@/services/shops.service";
import { shopOwnersService } from "@/services/shopOwners.service";
import { INDIAN_STATES } from "@/lib/constants";
import type { Shop } from "@/types/shop.types";

const schema = z.object({
  shopOwnerId: z.string().min(1, "Shop owner is required"),
  shopName: z.string().min(2),
  shopCode: z.string().min(2),
  shopType: z.enum(["MAIN", "BRANCH"]),
  businessType: z.enum(["RETAIL", "WHOLESALE", "RETAIL_WHOLESALE"]),
  billingType: z.enum(["GST", "NON_GST", "BOTH"]),
  contactMobile: z.string().regex(/^[0-9]{10}$/).optional().or(z.literal("")),
  state: z.string().optional(),
  district: z.string().optional(),
  taluk: z.string().optional(),
  area: z.string().optional(),
  pincode: z.string().optional(),
  isActive: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

export default function ShopsPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["shops"],
    queryFn: shopsService.list,
    refetchOnMount: "always",
    staleTime: 0,
  });
  const { data: owners = [] } = useQuery({ queryKey: ["shop-owners"], queryFn: shopOwnersService.list });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["shops"] });

  return (
    <CrudManagementPage<Shop>
      title="Shops"
      description="Manage shops across all owners with business and billing types."
      rows={data}
      searchKeys={["shopName", "shopCode", "shopOwnerName", "state", "district"]}
      columns={[
        { key: "shopName", header: "Shop", render: (r) => <span className="font-medium">{r.shopName}</span> },
        { key: "shopCode", header: "Code" },
        { key: "shopOwnerName", header: "Owner" },
        { key: "shopType", header: "Type" },
        { key: "businessType", header: "Business", render: (r) => r.businessType.replace(/_/g, "/") },
        { key: "billingType", header: "Billing" },
        { key: "state", header: "State" },
      ]}
      formTitle="Shop"
      formContent={(record, close) => (
        <GenericForm<Values>
          schema={schema}
          defaultValues={{
            shopOwnerId: String(record?.shopOwnerId ?? owners[0]?.id ?? ""),
            shopName: record?.shopName ?? "",
            shopCode: record?.shopCode ?? "",
            shopType: (record?.shopType as "MAIN" | "BRANCH") ?? "MAIN",
            businessType: (record?.businessType as Values["businessType"]) ?? "RETAIL",
            billingType: (record?.billingType as Values["billingType"]) ?? "GST",
            contactMobile: record?.contactMobile ?? "",
            state: record?.state ?? "",
            district: record?.district ?? "",
            taluk: record?.taluk ?? "",
            area: record?.area ?? "",
            pincode: record?.pincode ?? "",
            isActive: record?.isActive ?? true,
          }}
          fields={[
            {
              name: "shopOwnerId",
              label: "Shop Owner",
              type: "select",
              options: owners.map((o) => ({ label: o.name, value: String(o.id) })),
            },
            { name: "shopName", label: "Shop Name" },
            { name: "shopCode", label: "Shop Code" },
            { name: "shopType", label: "Shop Type", type: "select", options: [{ label: "Main", value: "MAIN" }, { label: "Branch", value: "BRANCH" }] },
            {
              name: "businessType",
              label: "Business Type",
              type: "select",
              options: [
                { label: "Retail", value: "RETAIL" },
                { label: "Wholesale", value: "WHOLESALE" },
                { label: "Retail & Wholesale", value: "RETAIL_WHOLESALE" },
              ],
            },
            {
              name: "billingType",
              label: "Billing Type",
              type: "select",
              options: [
                { label: "GST", value: "GST" },
                { label: "Non-GST", value: "NON_GST" },
                { label: "Both", value: "BOTH" },
              ],
            },
            { name: "contactMobile", label: "Contact Mobile", type: "tel" },
            { name: "state", label: "State", type: "select", options: INDIAN_STATES.map((s) => ({ label: s, value: s })) },
            { name: "district", label: "District" },
            { name: "taluk", label: "Taluk" },
            { name: "area", label: "Area" },
            { name: "pincode", label: "Pincode" },
            { name: "isActive", label: "Active", type: "switch" },
          ]}
          onSubmit={async (values) => {
            if (record) await shopsService.update(record.id, values);
            else await shopsService.create(values);
            invalidate();
          }}
          onCancel={close}
        />
      )}
      viewContent={(r) => (
        <>
          <InfoRow label="Shop Name" value={r.shopName} />
          <InfoRow label="Code" value={r.shopCode} />
          <InfoRow label="Owner" value={r.shopOwnerName} />
          <InfoRow label="Type" value={r.shopType} />
          <InfoRow label="Business" value={r.businessType.replace(/_/g, " / ")} />
          <InfoRow label="Billing" value={r.billingType} />
          <InfoRow label="Contact" value={r.contactMobile} />
          <InfoRow label="Address" value={`${r.area ?? ""}, ${r.district ?? ""}, ${r.state ?? ""}`} />
        </>
      )}
      onDelete={async (r) => {
        await shopsService.remove(r.id);
        invalidate();
      }}
      onToggleStatus={async (r) => {
        await shopsService.toggleStatus(r.id, !r.isActive);
        invalidate();
      }}
    />
  );
}
