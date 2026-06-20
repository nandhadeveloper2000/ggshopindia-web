# Stock Inventory Ecommerce — Frontend

Enterprise eCommerce + Inventory Management dashboard for **Super Admin**, **Shop Owner**, **Shop Staff**, **Customer**, and **Vendor** roles. Built with Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.

## Stack

- **Next.js 14** (App Router)
- **TypeScript** strict mode
- **Tailwind CSS** + custom theme via CSS variables
- **shadcn/ui** components (Radix + class-variance-authority)
- **TanStack Query v5** for data fetching
- **Zustand** for global state (auth, cart, shop context, sidebar)
- **React Hook Form** + **Zod** validation
- **Axios** API client with bearer-token interceptor
- **Recharts** for dashboard analytics
- **Sonner** for toast notifications
- **Lucide React** icons

## Quick start

```bash
npm install
cp .env.local.example .env.local   # adjust API base URL if needed
npm run dev
```

Open http://localhost:3000.

Build & run:
```bash
npm run build
npm start
```

Type-check:
```bash
npm run type-check
```

## Environment

`.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_APP_NAME=Stock Inventory Ecommerce
```

## Sign in

Three branded portals, each role-locked:

| Portal | URL | Roles allowed |
| --- | --- | --- |
| Master Admin | `/master` | MASTER_ADMIN, MANAGER, SUPERVISOR, STAFF |
| Seller | `/seller` | SHOP_OWNER, SHOP_MANAGER, SHOP_SUPERVISOR, EMPLOYEE, VENDOR |
| Customer | `/login` | CUSTOMER |

Each portal exposes three sign-in methods (tabs at the top): **Password**, **OTP**, **PIN**. The backend must be running and seeded with users — there is no mock or demo fallback.

The backend (`stock-inventory-ecommerce-backend`) seeds two Master Admin accounts on startup so you can sign in immediately at `/master` once Postgres is up.

## Folder structure

```
src/
  app/                    # Next.js App Router pages
    auth/                 # login, otp-login, pin-login, forgot-password
    super-admin/          # Super Admin module (dashboard, users, shops, catalog…)
    shop-owner/           # Shop Owner module (dashboard, products, purchases, sales…)
    shop-staff/           # Shop Staff module (POS billing, sales, stock…)
    customer/             # Customer storefront (home, products, cart, checkout…)
    vendor/               # Vendor portal (dashboard, profile, POs, payments…)
  components/
    layout/               # AppSidebar, AppTopbar, MobileSidebar, RoleLayout
    ui/                   # shadcn/ui primitives
    common/               # DataTable, FormModal, ConfirmDialog, StatCard…
    forms/                # GenericForm wrapper for RHF + Zod
    dashboard/            # SalesChart, PurchaseChart, StockValueChart…
    ecommerce/            # ProductCard, ProductGrid, ProductFilterSidebar…
  lib/                    # axios, auth, roles, routes, validators, utils
  services/               # API service files (one per resource)
  hooks/                  # useAuth, useDebounce, usePagination…
  store/                  # auth.store, cart.store, shop.store, sidebar.store
  types/                  # TypeScript interfaces and enums
```

## Role-based architecture

Each role has its own route group under `app/`. Layouts wrap the role group with `RoleLayout`, which:

1. Redirects unauthenticated users to `/auth/login`.
2. Redirects users without the required role to their own home (`getRoleHome`).
3. Renders the **collapsible desktop sidebar** + **mobile sheet sidebar** + **sticky topbar**.

`src/lib/routes.ts` is the canonical URL map. `src/components/layout/nav-items.ts` defines the per-role sidebar menu.

## Reusable patterns

- **`CrudManagementPage<T>`** — composes PageHeader + search + filters + DataTable + Add/Edit `FormModal` + ViewModal + delete/status `ConfirmDialog`. Almost every management page is built on this.
- **`GenericForm<T>`** — RHF + Zod + shadcn fields with `text | textarea | select | switch | date | number | email | tel | password` types.
- **`DataTable<T>`** — typed columns, loading skeleton, empty state, search, filter slot, row actions, client-side or server-side pagination, responsive horizontal scroll.
- **`ReportsPage`** — common filter shell (date range, shop, status, export, print) used by all reports pages.
- **`NotificationsPage`** / **`SettingsPage`** — shared across roles.

## API integration

`src/lib/axios.ts` configures the global Axios client:

- `baseURL` from `NEXT_PUBLIC_API_BASE_URL`
- Bearer token attached from `localStorage`
- 401 → clear session & redirect to `/auth/login`

Services live in `src/services/*.service.ts` and follow the same shape:

```ts
export const usersService = {
  list, get, create, update, toggleStatus, remove,
};
```

Each service calls the real Spring Boot endpoints directly. If the backend is unreachable or rejects a request, the error surfaces to the page (TanStack Query's `isError`), not silently swallowed.

### Expected backend endpoints (Spring Boot)

```
POST   /auth/login              POST   /auth/otp/request
POST   /auth/otp/verify         POST   /auth/pin
POST   /auth/forgot-password

GET    /users                   POST   /users
GET    /users/{id}              PUT    /users/{id}
DELETE /users/{id}              PATCH  /users/{id}/status

GET    /shop-owners                       (CRUD)
GET    /shops                             (CRUD)
GET    /vendors                           (CRUD)
GET    /customers                         (CRUD)

GET    /categories                        (CRUD)
GET    /sub-categories                    (CRUD)
GET    /brands                            (CRUD)
GET    /product-types                     (CRUD)
GET    /models                            (CRUD)
GET    /product-attributes                (CRUD)
GET    /product-compatibilities           (CRUD)

GET    /products                          (CRUD)
PATCH  /products/{id}/approve
PATCH  /products/{id}/reject
PATCH  /products/{id}/status

GET    /shop-products                     (CRUD)
GET    /purchases                         (CRUD)
POST   /purchases/{id}/return
GET    /sales
POST   /sales/{id}/return

GET    /stock-transfers                   (CRUD + approve/reject)
GET    /physical-stocks                   (create/list)

GET    /cart                              POST /cart/items
PATCH  /cart/items/{id}                   DELETE /cart/items/{id}

GET    /orders                            POST /orders
PATCH  /orders/{id}/status                POST /orders/{id}/cancel

GET    /invoices                          GET /invoices/{id}/pdf
GET    /notifications                     PATCH /notifications/{id}/read
GET    /reports/summary                   GET /reports/sales
GET    /reports/purchases                 GET /reports/stock-value
GET    /reports/order-status

POST   /barcode/generate
GET    /expenses                          (CRUD)
GET    /reviews                           POST /reviews
GET    /wishlist                          POST /wishlist
GET    /discounts                         POST /discounts/apply
```

## POS keyboard shortcuts

On `/shop-staff/pos`:

| Key   | Action |
| ----- | ------ |
| Space | Cash payment |
| F2    | Split payment |
| F3    | Card payment |
| F4    | UPI payment |
| F5    | Credit payment |

## Theme

Dark blue primary defined via CSS variables in `src/app/globals.css`. Adjust:

```css
--primary: 240 100% 27%;          /* dark blue */
--primary-hover: 240 100% 22%;    /* #00008b */
```

## Notes

- All forms use Zod + RHF with inline error messages and a loading submit button.
- Toasts (Sonner) are used for every CRUD action.
- Tables include built-in search, filters, pagination ("Rows per page: 10 · Showing 1 to 10 of 100 entries · Previous 1/10 Next"), empty states, and loading skeletons.
- Confirm dialogs guard every destructive or status-change action.
- Layout is responsive: fixed sidebar on desktop, collapsible on tablet, sheet drawer on mobile, sticky topbar, horizontally-scrollable tables.

## License

Proprietary — © 2026
