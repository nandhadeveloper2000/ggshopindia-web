import { UserRoleType, UserRole } from "./roles";

export function getLoginPortalFor(role: UserRoleType | string | undefined): string {
  switch (role) {
    case UserRole.MASTER_ADMIN:
    case UserRole.MANAGER:
    case UserRole.SUPERVISOR:
    case UserRole.STAFF:
      return "/master";
    case UserRole.SHOP_OWNER:
    case UserRole.SHOP_MANAGER:
    case UserRole.SHOP_SUPERVISOR:
    case UserRole.EMPLOYEE:
    case UserRole.VENDOR:
      return "/seller";
    case UserRole.CUSTOMER:
    default:
      return "/login";
  }
}
