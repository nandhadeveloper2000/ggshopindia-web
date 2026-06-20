"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { usersService } from "@/services/users.service";
import { shopsService } from "@/services/shops.service";
import { UserRole } from "@/lib/roles";
import type { User } from "@/types/user.types";

const staffRoles = [UserRole.SHOP_MANAGER, UserRole.SHOP_SUPERVISOR, UserRole.EMPLOYEE];

const createSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
  email: z.string().email().optional().or(z.literal("")),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Indian mobile must start with 6-9 and be 10 digits")
    .optional()
    .or(z.literal("")),
  role: z.string().min(1, "Role is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits").optional().or(z.literal("")),
  shopId: z.string().optional(),
  isActive: z.boolean().optional(),
});

const editSchema = createSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
});

type Values = z.infer<typeof editSchema>;

export default function StaffPage() {
  const qc = useQueryClient();
  const allUsers = useQuery({ queryKey: ["users"], queryFn: usersService.list });
  const { data: shops = [] } = useQuery({ queryKey: ["shops"], queryFn: shopsService.list });
  const staff = (allUsers.data ?? []).filter((u) => staffRoles.includes(u.role as typeof staffRoles[number]));
  const invalidate = () => qc.invalidateQueries({ queryKey: ["users"] });

  return (
    <CrudManagementPage<User>
      title="Staff"
      description="Manage shop staff and their role assignments."
      rows={staff}
      searchKeys={["name", "email", "mobile"]}
      columns={[
        { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "email", header: "Email" },
        { key: "mobile", header: "Mobile" },
        { key: "role", header: "Role", render: (r) => r.role.replace(/_/g, " ") },
      ]}
      formTitle="Staff"
      formContent={(record, close) => {
        const isEdit = Boolean(record);
        return (
          <GenericForm<Values>
            schema={isEdit ? editSchema : (createSchema as unknown as typeof editSchema)}
            defaultValues={{
              fullName: record?.name ?? "",
              username: record?.username ?? "",
              email: record?.email ?? "",
              mobile: record?.mobile ?? "",
              role: record?.role ?? UserRole.EMPLOYEE,
              password: "",
              pin: "",
              shopId: shops[0]?.id ? String(shops[0].id) : "",
              isActive: record?.isActive ?? true,
            }}
            fields={[
              { name: "fullName", label: "Full Name", colSpan: 2 },
              { name: "username", label: "Username" },
              { name: "email", label: "Email", type: "email" },
              { name: "mobile", label: "Mobile", type: "tel" },
              {
                name: "role",
                label: "Role",
                type: "select",
                options: staffRoles.map((r) => ({ label: r.replace(/_/g, " "), value: r })),
              },
              {
                name: "shopId",
                label: "Assigned Shop",
                type: "select",
                options: shops.map((s) => ({ label: s.shopName, value: String(s.id) })),
              },
              {
                name: "password",
                label: isEdit ? "Password (leave blank to keep)" : "Password",
                type: "password",
                description: "Min 8 characters",
              },
              {
                name: "pin",
                label: "PIN (optional)",
                type: "password",
                description: "4-6 digit numeric PIN",
              },
              { name: "isActive", label: "Active", type: "switch" },
            ]}
            onSubmit={async (values) => {
              const payload: Record<string, unknown> = {
                fullName: values.fullName,
                username: values.username,
                email: values.email || undefined,
                mobile: values.mobile || undefined,
                role: values.role,
                shopId: values.shopId || undefined,
                pin: values.pin || undefined,
              };
              if (values.password) payload.password = values.password;

              if (record) await usersService.update(record.id, payload as never);
              else await usersService.create(payload as never);
              invalidate();
            }}
            onCancel={close}
          />
        );
      }}
      viewContent={(r) => (
        <>
          <InfoRow label="Name" value={r.name} />
          <InfoRow label="Email" value={r.email} />
          <InfoRow label="Mobile" value={r.mobile} />
          <InfoRow label="Role" value={r.role.replace(/_/g, " ")} />
        </>
      )}
      onDelete={async (r) => {
        await usersService.remove(r.id);
        invalidate();
      }}
      onToggleStatus={async (r) => {
        await usersService.toggleStatus(r.id, !r.isActive);
        invalidate();
      }}
    />
  );
}
