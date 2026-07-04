import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_KEYS } from "@/lib/constants";
import { getRoleFromToken } from "@/lib/jwt";
import {
  canAccessSuperAdmin,
  canAccessShopOwner,
  canAccessShopStaff,
  canAccessVendor,
  canAccessCustomer,
} from "@/lib/permissions";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Edge route protection — PARKED / INACTIVE.
 *
 * This file is intentionally named `middleware.ready.ts` (NOT `middleware.ts`)
 * so Next.js does not treat it as an active middleware entrypoint. The project
 * ships with `output: "export"` in next.config.mjs (static export to S3), and
 * Next.js HARD-REJECTS an active middleware in that mode:
 *     ⨯ Middleware cannot be used with "output: export"
 * (it errors in `next dev` and is ignored on S3 anyway, since static hosting
 * has no server to run it).
 *
 * ▶ TO ACTIVATE (when you move to a Node/Edge server — Vercel, container, etc.):
 *     1. Remove `output: "export"` (and `trailingSlash`) from next.config.mjs.
 *     2. Rename this file to `src/middleware.ts`.
 *   Nothing else changes — login already mirrors the JWT + role into cookies
 *   (see setAuthCookies in src/lib/auth.ts) which this middleware reads.
 *
 * UNTIL THEN, route protection is enforced by the client-side guards
 * (RoleLayout / customer layout / useRoleGuard), which redirect unauthorized
 * users to the correct login portal or to /unauthorized (403). This file is
 * correct and will activate automatically the moment you follow the steps above
 * — no further changes
 * needed. Role is read from the JWT (or the mirrored `si_role` cookie).
 * ─────────────────────────────────────────────────────────────────────────────
 */

type Area = {
  /** URL prefix that this rule protects (everything under it). */
  prefix: string;
  /** Where to send an unauthenticated user. */
  loginPath: string;
  /** Whether the given role may enter this area. */
  allows: (role?: string) => boolean;
};

const AREAS: Area[] = [
  { prefix: "/master/", loginPath: "/master", allows: canAccessSuperAdmin },
  {
    prefix: "/seller/",
    loginPath: "/seller",
    allows: (r) => canAccessShopOwner(r) || canAccessShopStaff(r) || canAccessVendor(r),
  },
  { prefix: "/shop-staff/", loginPath: "/seller", allows: canAccessShopStaff },
  { prefix: "/vendor/", loginPath: "/seller", allows: canAccessVendor },
  // Signed-in shopper area (Flipkart-style URLs). Public browsing (`/`,
  // `/products`, `/{slug}/p/{id}`, `/category`) is intentionally NOT listed.
  { prefix: "/account", loginPath: "/login", allows: canAccessCustomer },
  { prefix: "/wishlist", loginPath: "/login", allows: canAccessCustomer },
  { prefix: "/cart", loginPath: "/login", allows: canAccessCustomer },
  { prefix: "/checkout", loginPath: "/login", allows: canAccessCustomer },
];

function resolveRole(req: NextRequest): string | undefined {
  const token = req.cookies.get(COOKIE_KEYS.accessToken)?.value;
  const fromToken = getRoleFromToken(token);
  if (fromToken) return fromToken;
  // Fallback to the explicitly mirrored role cookie.
  const fromCookie = req.cookies.get(COOKIE_KEYS.role)?.value;
  return fromCookie ? fromCookie.toUpperCase() : undefined;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The bare login indexes (`/master`, `/seller`) must stay public even if the
  // matcher forwards them here.
  if (pathname === "/master" || pathname === "/seller") return NextResponse.next();

  // Match the first protected area this path falls under (prefixes end with "/"
  // so `/seller/dashboard` matches but `/seller` does not).
  const area = AREAS.find((a) => pathname.startsWith(a.prefix));
  if (!area) return NextResponse.next();

  const role = resolveRole(req);

  // Not signed in → bounce to the correct login portal, remembering the target.
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = area.loginPath;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Signed in but wrong role for this area → 403 Access Denied.
  if (!area.allows(role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/unauthorized";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/**
 * Only run on the protected trees. Static assets, the public homepage, login
 * portals and `/auth/*` are intentionally excluded.
 */
export const config = {
  matcher: [
    "/master/:path*",
    "/seller/:path*",
    "/shop-staff/:path*",
    "/vendor/:path*",
    "/account/:path*",
    "/wishlist/:path*",
    "/cart/:path*",
    "/checkout/:path*",
  ],
};
