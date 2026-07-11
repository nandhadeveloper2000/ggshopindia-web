import { Suspense } from "react";
import { PublicHeader } from "@/components/storefront/PublicHeader";
import { PublicFooter } from "@/components/storefront/PublicFooter";
import { slugify } from "@/lib/utils";
import ProductDetailsClient from "./product-details-client";

/**
 * PUBLIC product detail — Flipkart-style URL `/{name-slug}/p/{id}`.
 *
 * The app builds with `output: "export"` (static S3 hosting), so every product
 * page is pre-generated at build time from the public `/api/products` catalog
 * (see generateStaticParams). The slug is cosmetic — the client resolves the
 * product strictly by `id` — so a stale/renamed slug still loads the right item.
 *
 * NOTE: brand-new products become directly link-loadable only after the next
 * `next build`. In-app navigation (Link) works immediately, and `next dev`
 * renders any id on demand.
 */

interface ProductParam {
  slug: string;
  id: string;
}

export async function generateStaticParams(): Promise<ProductParam[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";
  const out: ProductParam[] = [];
  try {
    for (let page = 0; page < 50; page++) {
      const res = await fetch(
        `${base}/products?sortBy=createdAt&sortDir=desc&page=${page}&size=200`,
        { cache: "no-store" },
      );
      if (!res.ok) break;
      const json = (await res.json()) as {
        data?: { content?: Array<{ id?: string; name?: string; sku?: string }>; totalPages?: number };
      };
      const rows = json?.data?.content ?? [];
      for (const p of rows) {
        if (p?.id) out.push({ slug: slugify(p.name ?? p.sku) || "product", id: String(p.id) });
      }
      const totalPages = Number(json?.data?.totalPages ?? 1);
      if (rows.length === 0 || page + 1 >= totalPages) break;
    }
  } catch {
    // Backend unreachable at build time (e.g. CI) — fall through to the
    // placeholder below so the export build never fails.
  }
  // `output: export` requires at least one static param. When no products were
  // fetched (backend down at build time), emit a placeholder shell — same
  // approach as the orders route. Real product pages are generated whenever the
  // API is reachable; deep links to others rely on the SPA fallback / a rebuild.
  if (out.length === 0) {
    out.push({ slug: "product", id: "placeholder" });
  }
  return out;
}

export default function Page({ params }: { params: ProductParam }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <div className="container py-6">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <ProductDetailsClient id={params.id} />
          </Suspense>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
