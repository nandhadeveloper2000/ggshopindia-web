"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { usersService } from "@/services/users.service";
import { getSubordinateRoles, getVisibleRoles, UserRole, UserRoleType } from "@/lib/roles";
import { useAuthStore } from "@/store/auth.store";
import type { User } from "@/types/user.types";

const createSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Indian mobile must start with 6-9 and be 10 digits")
    .optional()
    .or(z.literal("")),
  role: z.string().min(1, "Role is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/\d/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  pin: z
    .string()
    .regex(/^\d{4,6}$/, "PIN must be 4-6 digits")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().optional(),
});

const editSchema = createSchema.extend({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/\d/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character")
    .optional()
    .or(z.literal("")),
});

type EditValues = z.infer<typeof editSchema>;

export default function UsersPage() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const visibleRoles = getVisibleRoles(currentUser?.role);
  const creatableRoles = getSubordinateRoles(currentUser?.role);
  const { data = [] } = useQuery({ queryKey: ["users"], queryFn: usersService.list });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["users"] });

  return (
    <CrudManagementPage<User>
      title="Users"
      description="Manage the staff hierarchy below your role. Shop owners, staff, customers, and vendors are managed on their dedicated pages."
      rows={data.filter((u) => visibleRoles.includes(u.role as UserRoleType))}
      searchKeys={["name", "email", "mobile", "username"]}
      columns={[
        { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "username", header: "Username" },
        { key: "email", header: "Email" },
        { key: "mobile", header: "Mobile" },
        { key: "role", header: "Role", render: (r) => r.role.replace(/_/g, " ") },
      ]}
      formTitle="User"
      formContent={(record, close) => {
        const isEdit = Boolean(record);
        return (
          <GenericForm<EditValues>
            schema={isEdit ? editSchema : (createSchema as unknown as typeof editSchema)}
            defaultValues={{
              fullName: record?.name ?? "",
              username: record?.username ?? "",
              email: record?.email ?? "",
              mobile: record?.mobile ?? "",
              role: record?.role ?? UserRole.STAFF,
              password: "",
              pin: "",
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
                options: creatableRoles.map((r) => ({ label: r.replace(/_/g, " "), value: r })),
              },
              {
                name: "password",
                label: isEdit ? "Password (leave blank to keep)" : "Password",
                type: "password",
                description: "Min 6 characters with uppercase, lowercase, number & special character",
              },
              {
                name: "pin",
                label: "PIN (optional)",
                type: "password",
                description: "4-6 digit numeric PIN for quick login",
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
          <InfoRow label="Username" value={r.username} />
          <InfoRow label="Email" value={r.email} />
          <InfoRow label="Mobile" value={r.mobile} />
          <InfoRow label="Role" value={r.role.replace(/_/g, " ")} />
          <InfoRow label="Status" value={r.isActive ? "Active" : "Inactive"} />
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

