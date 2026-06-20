import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  Tags,
  Layers,
  Cpu,
  Package,
  CheckSquare,
  BarChart3,
  Bell,
  Settings,
  Briefcase,
  UserCog,
  Truck,
  Receipt,
  ShoppingCart,
  Repeat,
  ClipboardList,
  Boxes,
  QrCode,
  Wallet,
  FileText,
  UserCircle,
  Home,
  Heart,
  Star,
  CreditCard,
  PackageSearch,
  ArrowLeftRight,
  ScrollText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { routes } from "@/lib/routes";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const superAdminNav: NavItem[] = [
  { label: "Dashboard", href: routes.superAdmin.dashboard, icon: LayoutDashboard },
  { label: "Users", href: routes.superAdmin.users, icon: Users },
  { label: "Shop Owners", href: routes.superAdmin.shopOwners, icon: UserCog },
  { label: "Categories", href: routes.superAdmin.categories, icon: Tags },
  { label: "Brands", href: routes.superAdmin.brands, icon: Briefcase },
  { label: "Sub Categories", href: routes.superAdmin.subCategories, icon: Layers },
  { label: "Product Types", href: routes.superAdmin.productTypes, icon: Boxes },
  { label: "Models", href: routes.superAdmin.models, icon: Cpu },
  { label: "Product Attributes", href: routes.superAdmin.productAttributes, icon: ScrollText },
  { label: "Product Compatibility", href: routes.superAdmin.productCompatibilities, icon: PackageSearch },
  { label: "Products", href: routes.superAdmin.products, icon: Package },
  { label: "Product Approvals", href: routes.superAdmin.productApprovals, icon: CheckSquare },
  { label: "Reports", href: routes.superAdmin.reports, icon: BarChart3 },
  { label: "Notifications", href: routes.superAdmin.notifications, icon: Bell },
  { label: "Settings", href: routes.superAdmin.settings, icon: Settings },
];

export const shopOwnerNav: NavItem[] = [
  { label: "Dashboard", href: routes.shopOwner.dashboard, icon: LayoutDashboard },
  { label: "My Shops", href: routes.shopOwner.shops, icon: Store },
  { label: "Staff", href: routes.shopOwner.staff, icon: Users },
  { label: "Vendors", href: routes.shopOwner.vendors, icon: Truck },
  { label: "Products", href: routes.shopOwner.products, icon: Package },
  { label: "Shop Products", href: routes.shopOwner.shopProducts, icon: Boxes },
  { label: "Purchases", href: routes.shopOwner.purchases, icon: ShoppingBag },
  { label: "Purchase Returns", href: routes.shopOwner.purchaseReturns, icon: Repeat },
  { label: "Sales", href: routes.shopOwner.sales, icon: Receipt },
  { label: "Sales Returns", href: routes.shopOwner.salesReturns, icon: Repeat },
  { label: "Stock Transfers", href: routes.shopOwner.stockTransfers, icon: ArrowLeftRight },
  { label: "Physical Stock", href: routes.shopOwner.physicalStock, icon: ClipboardList },
  { label: "Barcode / QR", href: routes.shopOwner.barcode, icon: QrCode },
  { label: "Expenses", href: routes.shopOwner.expenses, icon: Wallet },
  { label: "Orders", href: routes.shopOwner.orders, icon: ShoppingCart },
  { label: "Invoices", href: routes.shopOwner.invoices, icon: FileText },
  { label: "Customers", href: routes.shopOwner.customers, icon: UserCircle },
  { label: "Reports", href: routes.shopOwner.reports, icon: BarChart3 },
  { label: "Notifications", href: routes.shopOwner.notifications, icon: Bell },
  { label: "Settings", href: routes.shopOwner.settings, icon: Settings },
];

export const shopStaffNav: NavItem[] = [
  { label: "Dashboard", href: routes.shopStaff.dashboard, icon: LayoutDashboard },
  { label: "POS Billing", href: routes.shopStaff.pos, icon: CreditCard },
  { label: "Sales", href: routes.shopStaff.sales, icon: Receipt },
  { label: "Sales Returns", href: routes.shopStaff.salesReturns, icon: Repeat },
  { label: "Stock", href: routes.shopStaff.stock, icon: Boxes },
  { label: "Stock Transfers", href: routes.shopStaff.stockTransfers, icon: ArrowLeftRight },
  { label: "Physical Stock", href: routes.shopStaff.physicalStock, icon: ClipboardList },
  { label: "Customers", href: routes.shopStaff.customers, icon: UserCircle },
  { label: "Barcode", href: routes.shopStaff.barcode, icon: QrCode },
  { label: "Notifications", href: routes.shopStaff.notifications, icon: Bell },
];

export const customerNav: NavItem[] = [
  { label: "Home", href: routes.customer.home, icon: Home },
  { label: "Products", href: routes.customer.products, icon: Package },
  { label: "Cart", href: routes.customer.cart, icon: ShoppingCart },
  { label: "Orders", href: routes.customer.orders, icon: ClipboardList },
  { label: "Wishlist", href: routes.customer.wishlist, icon: Heart },
  { label: "Reviews", href: routes.customer.reviews, icon: Star },
  { label: "Profile", href: routes.customer.profile, icon: UserCircle },
  { label: "Notifications", href: routes.customer.notifications, icon: Bell },
];

export const vendorNav: NavItem[] = [
  { label: "Dashboard", href: routes.vendor.dashboard, icon: LayoutDashboard },
  { label: "Profile", href: routes.vendor.profile, icon: UserCircle },
  { label: "Purchase Orders", href: routes.vendor.purchaseOrders, icon: ShoppingBag },
  { label: "Payments", href: routes.vendor.payments, icon: Wallet },
  { label: "Products Supplied", href: routes.vendor.productsSupplied, icon: Package },
  { label: "Reports", href: routes.vendor.reports, icon: BarChart3 },
  { label: "Notifications", href: routes.vendor.notifications, icon: Bell },
];

export const navByRole = {
  superAdmin: superAdminNav,
  shopOwner: shopOwnerNav,
  shopStaff: shopStaffNav,
  customer: customerNav,
  vendor: vendorNav,
};
