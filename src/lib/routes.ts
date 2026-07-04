import { slugify } from "./utils";

export const routes = {
  portals: {
    master: "/master",
    seller: "/seller",
    customer: "/login",
  },
  auth: {
    login: "/login",
    masterLogin: "/master",
    sellerLogin: "/seller",
    otpLogin: "/auth/otp-login",
    pinLogin: "/auth/pin-login",
    forgotPassword: "/auth/forgot-password",
  },
  superAdmin: {
    dashboard: "/master/dashboard",
    users: "/master/users",
    shopOwners: "/master/shop-owners",
    shopOwnerDetails: (id: string | number) => `/master/shop-owners/view/?id=${id}`,
    shopOwnerEdit: (id: string | number) => `/master/shop-owners/edit/?id=${id}`,
    productEdit: (id: string | number) => `/master/products/edit/?id=${id}`,
    shops: "/master/shops",
    categories: "/master/categories",
    brands: "/master/brands",
    categoryBrands: "/master/category-brands",
    subCategories: "/master/sub-categories",
    productTypes: "/master/product-types",
    models: "/master/models",
    productAttributes: "/master/product-attributes",
    productCompatibilities: "/master/product-compatibilities",
    products: "/master/products",
    productApprovals: "/master/product-approvals",
    reports: "/master/reports",
    notifications: "/master/notifications",
    settings: "/master/settings",
  },
  shopOwner: {
    dashboard: "/seller/dashboard",
    shops: "/seller/shops",
    staff: "/seller/staff",
    vendors: "/seller/vendors",
    products: "/seller/products",
    shopProducts: "/seller/shop-products",
    purchases: "/seller/purchases",
    purchaseReturns: "/seller/purchase-returns",
    sales: "/seller/sales",
    salesReturns: "/seller/sales-returns",
    stockTransfers: "/seller/stock-transfers",
    physicalStock: "/seller/physical-stock",
    barcode: "/seller/barcode",
    expenses: "/seller/expenses",
    orders: "/seller/orders",
    invoices: "/seller/invoices",
    customers: "/seller/customers",
    reports: "/seller/reports",
    notifications: "/seller/notifications",
    settings: "/seller/settings",
  },
  shopStaff: {
    dashboard: "/shop-staff/dashboard",
    pos: "/shop-staff/pos",
    sales: "/shop-staff/sales",
    salesReturns: "/shop-staff/sales-returns",
    stock: "/shop-staff/stock",
    stockTransfers: "/shop-staff/stock-transfers",
    physicalStock: "/shop-staff/physical-stock",
    customers: "/shop-staff/customers",
    barcode: "/shop-staff/barcode",
    notifications: "/shop-staff/notifications",
  },
  // Flipkart-style storefront URLs. Public browsing lives at the root
  // (`/`, `/products`, `/{slug}/p/{id}`); the signed-in shopper's area is under
  // `/account/*` plus top-level `/wishlist`, `/cart`, `/checkout`.
  customer: {
    home: "/",
    products: "/products",
    // Flipkart-shaped product URL: /{name-slug}/p/{id}. The slug is cosmetic —
    // the detail page resolves the product by id — so a stale slug still works.
    productDetails: (id: string | number, name?: string) =>
      `/${slugify(name) || "product"}/p/${id}`,
    category: (id: string | number, name?: string) => {
      const slug = slugify(name);
      const params = new URLSearchParams({ id: String(id) });
      if (slug) params.set("name", slug);
      return `/category/?${params.toString()}`;
    },
    cart: "/cart",
    checkout: "/checkout",
    orders: "/account/orders",
    orderDetails: (id: string | number) => `/account/orders/${id}`,
    invoices: "/account/invoices",
    wishlist: "/wishlist",
    reviews: "/account/reviews",
    profile: "/account",
    notifications: "/account/notifications",
  },
  vendor: {
    dashboard: "/vendor/dashboard",
    profile: "/vendor/profile",
    purchaseOrders: "/vendor/purchase-orders",
    payments: "/vendor/payments",
    productsSupplied: "/vendor/products-supplied",
    reports: "/vendor/reports",
    notifications: "/vendor/notifications",
  },
};
