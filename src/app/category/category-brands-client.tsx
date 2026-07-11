"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Package, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PublicHeader } from "@/components/storefront/PublicHeader";
import { PublicFooter } from "@/components/storefront/PublicFooter";
import {
  categoriesService,
  productTypesService,
  subCategoriesService,
} from "@/services/catalog.service";
import { categoryBrandsService } from "@/services/category-brands.service";
import { productsService } from "@/services/products.service";
import { routes } from "@/lib/routes";
import { BrandProductListing } from "./brand-product-listing";

/**
 * PUBLIC category page — served at `/category/?id=…&name=…[&pt=…&ptname=…][&brand=…&bname=…]`.
 *
 * Drill-down that mirrors the catalog hierarchy:
 *   Category → (Sub Category heading) → Product Type cards (image + name)
 *            → Product Type selected → brands mapped to that product type
 *            → Brand selected → Reliance-style product listing.
 *
 * A query-param route (not a `[id]` segment) is used deliberately so the page is
 * fully static and compatible with the app's `output: export` build. No auth
 * required — catalog reads are public GETs.
 */
export default function CategoryBrandsClient() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("id") ?? "";
  const nameFromUrl = searchParams.get("name") ?? "";
  const productTypeId = searchParams.get("pt") ?? "";
  const productTypeNameFromUrl = searchParams.get("ptname") ?? "";
  const selectedBrandId = searchParams.get("brand") ?? "";
  const brandNameFromUrl = searchParams.get("bname") ?? "";
  const enabled = !!categoryId;

  const { data: category } = useQuery({
    queryKey: ["public", "category", categoryId],
    queryFn: () => categoriesService.get(categoryId),
    retry: false,
    enabled,
  });
  const { data: subCategories = [] } = useQuery({
    queryKey: ["public", "sub-categories"],
    queryFn: subCategoriesService.list,
    retry: false,
    enabled,
  });
  const { data: productTypes = [] } = useQuery({
    queryKey: ["public", "product-types"],
    queryFn: productTypesService.list,
    retry: false,
    enabled,
  });
  // Brands mapped to the chosen product type.
  const { data: typeBrands = [], isLoading: brandsLoading } = useQuery({
    queryKey: ["public", "ptb-brands", productTypeId],
    queryFn: () => categoryBrandsService.listByProductType(productTypeId),
    retry: false,
    enabled: enabled && !!productTypeId,
  });
  // Products for the selected brand (further filtered by product type below).
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["public", "category-products", categoryId, selectedBrandId],
    queryFn: () => productsService.list({ categoryId, brandId: selectedBrandId }),
    retry: false,
    enabled: enabled && !!selectedBrandId,
  });

  const categoryName = category?.name ?? (nameFromUrl || "Category");

  // Sub categories of this category (active), each with its active product types.
  const subGroups = useMemo(() => {
    const subs = subCategories
      .filter((s) => String(s.categoryId) === String(categoryId) && s.isActive !== false)
      .sort((a, b) => a.name.localeCompare(b.name));
    return subs
      .map((s) => ({
        sub: s,
        types: productTypes
          .filter((p) => String(p.subCategoryId) === String(s.id) && p.isActive !== false)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((g) => g.types.length > 0);
  }, [subCategories, productTypes, categoryId]);

  const selectedType = productTypes.find((p) => String(p.id) === productTypeId);
  const productTypeName = selectedType?.name ?? (productTypeNameFromUrl || "Product Type");

  const activeBrands = typeBrands.filter((b) => b.isActive !== false);
  const selectedBrandName =
    activeBrands.find((b) => String(b.brandId) === selectedBrandId)?.brandName ?? brandNameFromUrl;

  // URL builders — preserve the current category (and product type) context.
  const withBase = () => {
    const params = new URLSearchParams({ id: categoryId });
    if (nameFromUrl) params.set("name", nameFromUrl);
    return params;
  };
  const typeHref = (ptId: string | number, ptName?: string) => {
    const params = withBase();
    params.set("pt", String(ptId));
    if (ptName) params.set("ptname", ptName);
    return `/category/?${params.toString()}`;
  };
  const brandHref = (brandId: string | number, brandName?: string) => {
    const params = withBase();
    if (productTypeId) params.set("pt", productTypeId);
    if (productTypeName) params.set("ptname", productTypeName);
    params.set("brand", String(brandId));
    if (brandName) params.set("bname", brandName);
    return `/category/?${params.toString()}`;
  };
  const categoryHref = routes.customer.category(categoryId, nameFromUrl || categoryName);
  const typeHrefSelf = productTypeId ? typeHref(productTypeId, productTypeName) : categoryHref;

  // This category + product type's approved, active products for the selected brand.
  const displayProducts = products.filter(
    (p) =>
      String(p.categoryId ?? "") === String(categoryId) &&
      (!productTypeId || String(p.productTypeId ?? "") === productTypeId) &&
      p.approvalStatus === "APPROVED" &&
      p.isActiveGlobal &&
      String(p.brandId ?? "") === selectedBrandId,
  );

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        <div className="container space-y-6 py-6">
          {/* Breadcrumb: Home > {Category} [> {Product Type}] [> {Brand}] */}
          <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <Link href="/" className="transition hover:text-primary">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            {productTypeId || selectedBrandId ? (
              <Link href={categoryHref} className="transition hover:text-primary">
                {categoryName}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{categoryName}</span>
            )}
            {productTypeId && (
              <>
                <ChevronRight className="h-4 w-4" />
                {selectedBrandId ? (
                  <Link href={typeHrefSelf} className="transition hover:text-primary">
                    {productTypeName}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{productTypeName}</span>
                )}
              </>
            )}
            {selectedBrandId && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-foreground">{selectedBrandName || "Brand"}</span>
              </>
            )}
          </nav>

          {selectedBrandId ? (
            /* Brand selected → Reliance-style product listing. */
            <BrandProductListing
              title={`${selectedBrandName || "Brand"} ${productTypeName}`}
              products={displayProducts}
              loading={productsLoading}
            />
          ) : productTypeId ? (
            /* Product type selected → brands mapped to it. */
            <section className="space-y-4 duration-500 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold sm:text-2xl">
                    {productTypeName} — Shop by Brand
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {activeBrands.length} brand{activeBrands.length === 1 ? "" : "s"} available
                  </p>
                </div>
              </div>

              {brandsLoading ? (
                <p className="text-sm text-muted-foreground">Loading brands…</p>
              ) : activeBrands.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                    <Store className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">No brands yet</p>
                    <p className="text-xs text-muted-foreground">
                      Brands for this product type will appear here once they are mapped.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-3 gap-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
                  {activeBrands.map((brand, i) => (
                    <Link
                      key={String(brand.id)}
                      href={brandHref(brand.brandId, brand.brandName)}
                      style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
                      className="group flex flex-col items-center gap-2 text-center duration-500 animate-in fade-in zoom-in-95"
                    >
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-border transition group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary">
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
                </div>
              )}
            </section>
          ) : (
            /* Category selected → sub categories, each heading a grid of product types. */
            <div className="space-y-8">
              <div>
                <h1 className="text-xl font-semibold sm:text-2xl">Shop {categoryName}</h1>
                <p className="text-sm text-muted-foreground">
                  Pick a product type to see its brands.
                </p>
              </div>

              {subGroups.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Nothing here yet</p>
                    <p className="text-xs text-muted-foreground">
                      Product types for this category will appear here once they are added.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                subGroups.map((group) => (
                  <section key={String(group.sub.id)} className="space-y-4">
                    <h2 className="text-lg font-semibold">{group.sub.name}</h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {group.types.map((t, i) => (
                        <Link
                          key={String(t.id)}
                          href={typeHref(t.id, t.name)}
                          style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
                          className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center transition duration-500 animate-in fade-in slide-in-from-bottom-2 hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
                        >
                          <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-lg bg-muted/40">
                            {t.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={t.imageUrl}
                                alt={t.name}
                                className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <Package className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground group-hover:text-primary">
                            {t.name}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
