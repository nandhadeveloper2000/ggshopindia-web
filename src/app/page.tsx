"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  MapPin,
  Store,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicHeader } from "@/components/storefront/PublicHeader";
import { PublicFooter } from "@/components/storefront/PublicFooter";
import { CategoryStrip } from "@/components/storefront/CategoryStrip";
import { WishlistButton } from "@/components/ecommerce/WishlistButton";
import { categoriesService } from "@/services/catalog.service";
import { productsService } from "@/services/products.service";
import { shopsService } from "@/services/shops.service";
import { routes } from "@/lib/routes";

/**
 * PUBLIC customer-facing homepage — served at `/`
 * (production: https://ggshopindia.com/).
 *
 * No authentication required. Data is fetched best-effort and the page always
 * renders a complete storefront even when the API is unreachable, so the
 * welcome experience never breaks.
 */

export default function PublicHomePage() {
  const { data: categories = [] } = useQuery({
    queryKey: ["public", "categories"],
    queryFn: categoriesService.list,
    retry: false,
  });

  // Products come from the MASTER catalog (`/products`, a public GET), same as
  // the category page — the storefront homepage is not tied to any one shop, so
  // it can't use the shop-inventory endpoint (which needs a shopId + auth).
  const { data: products = [] } = useQuery({
    queryKey: ["public", "products"],
    queryFn: () => productsService.list(),
    retry: false,
  });

  const { data: shops = [] } = useQuery({
    queryKey: ["public", "shops"],
    queryFn: shopsService.list,
    retry: false,
  });

  const categoryItems = categories.map((c) => ({
    id: c.id,
    name: c.name,
    imageUrl: c.imageUrl,
  }));

  const nearbyShops = shops.slice(0, 6);

  // Only approved, globally-active products are shown to the public shopper.
  const featuredProducts = products
    .filter((p) => p.approvalStatus === "APPROVED" && p.isActiveGlobal)
    .slice(0, 12);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* ── Full-width category bar (Reliance Digital style) ───────── */}
        <div className="border-b bg-white">
          <div className="container">
            <CategoryStrip categories={categoryItems} />
          </div>
        </div>

        <div className="container space-y-8 pb-10 pt-6 lg:pb-12">
          {/* ── Nearby Shops ─────────────────────────────────────────── */}
          <section>
            <SectionHeading title="Nearby Shops" />
            {nearbyShops.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {nearbyShops.map((shop) => (
                  <Card key={shop.id} className="overflow-hidden">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Store className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {shop.name ?? "Local Shop"}
                        </p>
                        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {shop.address?.area ?? shop.address?.district ?? "Near you"}
                        </p>
                        {shop.deliveryAvailable && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-600">
                            <Truck className="h-3 w-3" /> Delivery available
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Discovering shops near you</p>
                  <p className="text-xs text-muted-foreground">
                    Trusted local shops will appear here based on your location.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* ── Featured Products ────────────────────────────────────── */}
          <section>
            <SectionHeading
              title="Featured Products"
              href={routes.customer.products}
              linkLabel="View all"
            />
            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {featuredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="group relative h-full overflow-hidden transition hover:border-primary hover:shadow-sm"
                  >
                    <WishlistButton
                      productId={product.id}
                      variant="secondary"
                      className="absolute right-2 top-2 z-10 rounded-full bg-background/90 shadow-sm"
                    />
                    <Link
                      href={routes.customer.productDetails(product.id, product.itemName)}
                      className="block"
                    >
                      <div className="flex aspect-square items-center justify-center bg-muted/40">
                        {product.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0]}
                            alt={product.itemName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Store className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <CardContent className="space-y-1 p-3">
                        {product.brandName && (
                          <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
                            {product.brandName}
                          </p>
                        )}
                        <p className="line-clamp-2 text-sm font-medium leading-tight">
                          {product.itemName}
                        </p>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                  <Store className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No products yet</p>
                  <p className="text-xs text-muted-foreground">
                    Featured products will appear here as shops add them.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function SectionHeading({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
      {href && linkLabel && (
        <Button variant="link" asChild className="text-primary">
          <Link href={href}>
            {linkLabel} <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
