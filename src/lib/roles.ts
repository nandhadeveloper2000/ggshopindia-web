export const UserRole = {
  MASTER_ADMIN: "MASTER_ADMIN",
  MANAGER: "MANAGER",
  SUPERVISOR: "SUPERVISOR",
  STAFF: "STAFF",
  SHOP_OWNER: "SHOP_OWNER",
  SHOP_MANAGER: "SHOP_MANAGER",
  SHOP_SUPERVISOR: "SHOP_SUPERVISOR",
  EMPLOYEE: "EMPLOYEE",
  CUSTOMER: "CUSTOMER",
  VENDOR: "VENDOR",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const SUPER_ADMIN_ROLES: UserRoleType[] = [
  UserRole.MASTER_ADMIN,
  UserRole.MANAGER,
  UserRole.SUPERVISOR,
  UserRole.STAFF,
];

export const SHOP_OWNER_ROLES: UserRoleType[] = [UserRole.SHOP_OWNER];

export const SHOP_STAFF_ROLES: UserRoleType[] = [
  UserRole.SHOP_MANAGER,
  UserRole.SHOP_SUPERVISOR,
  UserRole.EMPLOYEE,
];

export const CUSTOMER_ROLES: UserRoleType[] = [UserRole.CUSTOMER];
export const VENDOR_ROLES: UserRoleType[] = [UserRole.VENDOR];

// Roles a given role is allowed to CREATE on the Super Admin Users page.
// Strictly subordinates — you cannot create a peer or a higher role.
export function getSubordinateRoles(role: UserRoleType | string | undefined): UserRoleType[] {
  switch (role) {
    case UserRole.MASTER_ADMIN:
      return [UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.STAFF];
    case UserRole.MANAGER:
      return [UserRole.SUPERVISOR, UserRole.STAFF];
    case UserRole.SUPERVISOR:
      return [UserRole.STAFF];
    default:
      return [];
  }
}

// Roles a given role is allowed to VIEW in the Users list — the user's own
// role plus everything below it. Master sees all four; Staff sees only Staff.
export function getVisibleRoles(role: UserRoleType | string | undefined): UserRoleType[] {
  switch (role) {
    case UserRole.MASTER_ADMIN:
      return [UserRole.MASTER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.STAFF];
    case UserRole.MANAGER:
      return [UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.STAFF];
    case UserRole.SUPERVISOR:
      return [UserRole.SUPERVISOR, UserRole.STAFF];
    case UserRole.STAFF:
      return [UserRole.STAFF];
    default:
      return [];
  }
}

export function getRoleHome(role: UserRoleType | string | undefined): string {
  switch (role) {
    case UserRole.MASTER_ADMIN:
    case UserRole.MANAGER:
    case UserRole.SUPERVISOR:
    case UserRole.STAFF:
      return "/super-admin/dashboard";
    case UserRole.SHOP_OWNER:
      return "/shop-owner/dashboard";
    case UserRole.SHOP_MANAGER:
    case UserRole.SHOP_SUPERVISOR:
    case UserRole.EMPLOYEE:
      return "/shop-staff/dashboard";
    case UserRole.CUSTOMER:
      return "/customer/home";
    case UserRole.VENDOR:
      return "/vendor/dashboard";
    default:
      return "/login";
  }
}

export function getRoleLabel(role: UserRoleType | string | undefined): string {
  if (!role) return "—";
  return role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
