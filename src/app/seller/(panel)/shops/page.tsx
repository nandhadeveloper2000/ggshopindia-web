"use client";
// Shop owner manages own shops — reuses the same shops UI as super-admin
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { shopsService } from "@/services/shops.service";
import { INDIAN_STATES } from "@/lib/constants";
import { useAuthStore } from "@/store/auth.store";
import type { Shop } from "@/types/shop.types";

const schema = z.object({
  shopName: z.string().min(2),
  shopCode: z.string().min(2),
  shopType: z.enum(["MAIN", "BRANCH"]),
  businessType: z.enum(["RETAIL", "WHOLESALE", "RETAIL_WHOLESALE"]),
  billingType: z.enum(["GST", "NON_GST", "BOTH"]),
  contactMobile: z.string().regex(/^[0-9]{10}$/).optional().or(z.literal("")),
  state: z.string().optional(),
  district: z.string().optional(),
  area: z.string().optional(),
  pincode: z.string().optional(),
  ecommerceEnabled: z.boolean().optional(),
  billingEnabled: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

export default function MyShopsPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  // A Business Location login (shopId set) sees only its own shop; a Shop Owner
  // sees all shops under their owner account; admins fall back to the full list.
  const isLocationUser = Boolean(user?.shopId);
  const { data = [] } = useQuery({
    queryKey: ["seller-shops", user?.shopId ?? null, user?.shopOwnerId ?? null],
    enabled: Boolean(user),
    queryFn: async () => {
      if (user?.shopId) return [await shopsService.get(String(user.shopId))];
      if (user?.shopOwnerId) return shopsService.getByOwner(String(user.shopOwnerId));
      return shopsService.list();
    },
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["seller-shops"] });

  return (
    <CrudManagementPage<Shop>
      title={isLocationUser ? "My Business Location" : "My Shops"}
      description={
        isLocationUser
          ? "You are signed in to this business location. Only this location is shown."
          : "Manage your shops, business type, and billing settings."
      }
      rows={data}
      searchKeys={["shopName", "shopCode", "state"]}
      columns={[
        { key: "shopName", header: "Shop", render: (r) => <span className="font-medium">{r.shopName}</span> },
        { key: "shopCode", header: "Code" },
        { key: "shopType", header: "Type" },
        { key: "businessType", header: "Business", render: (r) => (r.businessType ?? "").replace(/_/g, "/") },
        { key: "billingType", header: "Billing" },
        { key: "state", header: "State" },
      ]}
      formTitle="Shop"
      formContent={isLocationUser ? undefined : (record, close) => (
        <GenericForm<Values>
          schema={schema}
          defaultValues={{
            shopName: record?.shopName ?? "",
            shopCode: record?.shopCode ?? "",
            shopType: (record?.shopType as "MAIN" | "BRANCH") ?? "MAIN",
            businessType: (record?.businessType as Values["businessType"]) ?? "RETAIL",
            billingType: (record?.billingType as Values["billingType"]) ?? "GST",
            contactMobile: record?.contactMobile ?? "",
            state: record?.state ?? "",
            district: record?.district ?? "",
            area: record?.area ?? "",
            pincode: record?.pincode ?? "",
            ecommerceEnabled: record?.ecommerceEnabled ?? false,
            billingEnabled: record?.billingEnabled ?? true,
            isActive: record?.isActive ?? true,
          }}
          fields={[
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
            { name: "area", label: "Area" },
            { name: "pincode", label: "Pincode" },
            { name: "ecommerceEnabled", label: "Ecommerce Enabled", type: "switch" },
            { name: "billingEnabled", label: "Billing Enabled", type: "switch" },
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
          <InfoRow label="Shop" value={r.shopName} />
          <InfoRow label="Code" value={r.shopCode} />
          <InfoRow label="Type" value={r.shopType} />
          <InfoRow label="Business" value={(r.businessType ?? "").replace(/_/g, " / ")} />
          <InfoRow label="Billing" value={r.billingType} />
          <InfoRow label="Address" value={`${r.area ?? ""}, ${r.district ?? ""}, ${r.state ?? ""}`} />
          <InfoRow label="Ecommerce" value={r.ecommerceEnabled ? "Enabled" : "Disabled"} />
          <InfoRow label="Billing" value={r.billingEnabled ? "Enabled" : "Disabled"} />
        </>
      )}
      onDelete={
        isLocationUser
          ? undefined
          : async (r) => {
              await shopsService.remove(r.id);
              invalidate();
            }
      }
      onToggleStatus={
        isLocationUser
          ? undefined
          : async (r) => {
              await shopsService.toggleStatus(r.id, !r.isActive);
              invalidate();
            }
      }
    />
  );
}
