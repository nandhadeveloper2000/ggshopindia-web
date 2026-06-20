import { UserRoleType, UserRole } from "./roles";

export function canAccessSuperAdmin(role?: UserRoleType | string): boolean {
  return (
    role === UserRole.MASTER_ADMIN ||
    role === UserRole.MANAGER ||
    role === UserRole.SUPERVISOR ||
    role === UserRole.STAFF
  );
}

export function canAccessShopOwner(role?: UserRoleType | string): boolean {
  return role === UserRole.SHOP_OWNER;
}

export function canAccessShopStaff(role?: UserRoleType | string): boolean {
  return (
    role === UserRole.SHOP_MANAGER ||
    role === UserRole.SHOP_SUPERVISOR ||
    role === UserRole.EMPLOYEE
  );
}

export function canAccessCustomer(role?: UserRoleType | string): boolean {
  return role === UserRole.CUSTOMER;
}

export function canAccessVendor(role?: UserRoleType | string): boolean {
  return role === UserRole.VENDOR;
}
