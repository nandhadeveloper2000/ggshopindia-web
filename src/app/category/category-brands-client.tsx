"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PublicHeader } from "@/components/storefront/PublicHeader";
import { PublicFooter } from "@/components/storefront/PublicFooter";
import { HScroll } from "@/components/common/HScroll";
import { categoriesService } from "@/services/catalog.service";
import { categoryBrandsService } from "@/services/category-brands.service";
import { productsService } from "@/services/products.service";
import { routes } from "@/lib/routes";
import { BrandProductListing } from "./brand-product-listing";

/**
 * PUBLIC category page — served at `/category/?id=…&name=…[&brand=…&bname=…]`.
 *
 * No brand selected → a horizontal, scrollable row of the brands mapped to this
 * category. Brand selected → the brand row is hidden and a Reliance Digital-style
 * product listing (filters + sort + grid) is shown instead. Breadcrumb:
 * `Home > {Category} [> {Brand}]`. No authentication required.
 *
 * A query-param route (not a `[id]` segment) is used deliberately so the page is
 * fully static and compatible with the app's `output: export` build.
 */
export default function CategoryBrandsClient() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("id") ?? "";
  const nameFromUrl = searchParams.get("name") ?? "";
  const selectedBrandId = searchParams.get("brand") ?? "";
  const brandNameFromUrl = searchParams.get("bname") ?? "";
  const enabled = !!categoryId;

  const { data: category } = useQuery({
    queryKey: ["public", "category", categoryId],
    queryFn: () => categoriesService.get(categoryId),
    retry: false,
    enabled,
  });

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["public", "category-brands", categoryId],
    queryFn: () => categoryBrandsService.list(categoryId),
    retry: false,
    enabled,
  });

  // Products for the SELECTED brand only (no brand → no fetch, no default list).
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["public", "category-products", categoryId, selectedBrandId],
    queryFn: () => productsService.list({ categoryId, brandId: selectedBrandId }),
    retry: false,
    enabled: enabled && !!selectedBrandId,
  });

  const categoryName = category?.name ?? brands[0]?.categoryName ?? (nameFromUrl || "Category");
  const activeBrands = brands.filter((b) => b.isActive !== false);

  const selectedBrandName =
    activeBrands.find((b) => String(b.brandId) === selectedBrandId)?.brandName ?? brandNameFromUrl;

  // Builds the URL for a brand chip, preserving the current category context.
  const brandHref = (brandId: string | number, brandName?: string) => {
    const params = new URLSearchParams({ id: categoryId });
    if (nameFromUrl) params.set("name", nameFromUrl);
    params.set("brand", String(brandId));
    if (brandName) params.set("bname", brandName);
    return `/category/?${params.toString()}`;
  };
  const categoryHref = routes.customer.category(categoryId, nameFromUrl || categoryName);

  // This category's approved, active products for the selected brand.
  const displayProducts = products.filter(
    (p) =>
      String(p.categoryId ?? "") === String(categoryId) &&
      p.approvalStatus === "APPROVED" &&
      p.isActiveGlobal &&
      String(p.brandId ?? "") === selectedBrandId,
  );

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        <div className="container space-y-6 py-6">
          {/* Breadcrumb: Home > {Category} [> {Brand}] */}
          <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <Link href="/" className="transition hover:text-primary">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            {selectedBrandId ? (
              <Link href={categoryHref} className="transition hover:text-primary">
                {categoryName}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{categoryName}</span>
            )}
            {selectedBrandId && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-foreground">{selectedBrandName || "Brand"}</span>
              </>
            )}
          </nav>

          {selectedBrandId ? (
            /* Brand selected → Reliance-style product listing (brand row hidden). */
            <BrandProductListing
              title={`${selectedBrandName || "Brand"} ${categoryName}`}
              products={displayProducts}
              loading={productsLoading}
            />
          ) : (
            /* No brand → brand selector. */
            <>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold sm:text-2xl">Shop {categoryName} by Brand</h1>
                  <p className="text-sm text-muted-foreground">
                    {activeBrands.length} brand{activeBrands.length === 1 ? "" : "s"} available
                  </p>
                </div>
                <Link
                  href={routes.customer.products}
                  className="shrink-0 text-sm font-medium text-primary transition hover:underline"
                >
                  View all →
                </Link>
              </div>

              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading brands…</p>
              ) : activeBrands.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                    <Store className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">No brands yet</p>
                    <p className="text-xs text-muted-foreground">
                      Brands for this category will appear here once they are mapped.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <HScroll className="gap-5 pb-2">
                  {activeBrands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={brandHref(brand.brandId, brand.brandName)}
                      className="group flex w-24 shrink-0 flex-col items-center gap-2 text-center"
                    >
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-border transition group-hover:ring-2 group-hover:ring-primary">
                        {brand.brandLogoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={brand.brandLogoUrl}
                            alt={brand.brandName ?? "Brand"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-semibold text-primary">
                            {(brand.brandName ?? "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-1 w-full text-sm font-medium leading-tight text-foreground group-hover:text-primary">
                        {brand.brandName ?? "Brand"}
                      </p>
                    </Link>
                  ))}
                </HScroll>
              )}
            </>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
