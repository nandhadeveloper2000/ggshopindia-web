"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { ProductFilterSidebar, type FilterState } from "@/components/ecommerce/ProductFilterSidebar";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/common/SearchInput";
import { PublicHeader } from "@/components/storefront/PublicHeader";
import { PublicFooter } from "@/components/storefront/PublicFooter";
import { ProductListingCard } from "@/app/category/brand-product-listing";
import { useDebounce } from "@/hooks/useDebounce";
import { productsService } from "@/services/products.service";
import { categoriesService, brandsService } from "@/services/catalog.service";

/**
 * PUBLIC products page — served at `/products` (also the header search target,
 * `/products?q=…`). Searches the MASTER catalog by product name, brand, model,
 * and SKU; category/brand checkboxes narrow further. No authentication required.
 */
function ProductsInner() {
  const q0 = useSearchParams().get("q") ?? "";

  const { data: products = [] } = useQuery({
    queryKey: ["all-products"],
    queryFn: () => productsService.list(),
    retry: false,
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list, retry: false });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: brandsService.list, retry: false });

  const [search, setSearch] = useState(q0);
  const debounced = useDebounce(search);
  const [filters, setFilters] = useState<FilterState>({});
  const [sort, setSort] = useState<string>("latest");
  const [compare, setCompare] = useState<Set<string>>(new Set());

  const toggleCompare = (id: string) =>
    setCompare((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.approvalStatus === "APPROVED" && p.isActiveGlobal);

    if (filters.categories?.length) list = list.filter((p) => filters.categories!.includes(p.categoryName ?? ""));
    if (filters.brands?.length) list = list.filter((p) => filters.brands!.includes(p.brandName ?? ""));

    // Lenient search: score by how many typed words appear across the product's
    // name / brand / category / model / SKU AND its variant + spec data (colour,
    // RAM, storage, etc.). Keep any match, ranked by relevance — so a long
    // descriptive query still surfaces the best products.
    const q = debounced.trim().toLowerCase();
    if (q) {
      const terms = q.split(/[\s,]+/).filter(Boolean);
      return list
        .map((p) => {
          const hay = [
            p.itemName,
            p.brandName,
            p.categoryName,
            p.modelName,
            p.sku,
            JSON.stringify(p.variant ?? ""),
            JSON.stringify(p.dynamicFields ?? ""),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          const score = terms.reduce((n, t) => (hay.includes(t) ? n + 1 : n), 0);
          return { p, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.p);
    }

    return [...list].sort((a, b) => {
      if (sort === "name-asc") return (a.itemName ?? "").localeCompare(b.itemName ?? "");
      if (sort === "name-desc") return (b.itemName ?? "").localeCompare(a.itemName ?? "");
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });
  }, [products, debounced, filters, sort]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <div className="container py-6">
          <PageHeader
            title={q0 ? `Results for “${q0}”` : "Products"}
            description={`${filtered.length} product${filtered.length === 1 ? "" : "s"} found`}
          />
          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <ProductFilterSidebar categories={categories} brands={brands} value={filters} onChange={setFilters} />
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <SearchInput value={search} onChange={setSearch} />
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest</SelectItem>
                    <SelectItem value="name-asc">Name: A to Z</SelectItem>
                    <SelectItem value="name-desc">Name: Z to A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filtered.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
                    <Store className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">No products found</p>
                    <p className="text-xs text-muted-foreground">Try a different search or adjust your filters.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {filtered.map((p) => (
                    <ProductListingCard
                      key={p.id}
                      product={p}
                      query={debounced}
                      compareOn={compare.has(String(p.id))}
                      onToggleCompare={() => toggleCompare(String(p.id))}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsInner />
    </Suspense>
  );
}
