"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductGrid } from "@/components/ecommerce/ProductGrid";
import { ProductFilterSidebar, type FilterState } from "@/components/ecommerce/ProductFilterSidebar";
import { PageHeader } from "@/components/common/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/common/SearchInput";
import { useDebounce } from "@/hooks/useDebounce";
import { shopProductsService } from "@/services/shopProducts.service";
import { categoriesService, brandsService } from "@/services/catalog.service";

export default function CustomerProductsPage() {
  const { data: products = [] } = useQuery({ queryKey: ["shop-products"], queryFn: () => shopProductsService.list() });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: brandsService.list });

  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [filters, setFilters] = useState<FilterState>({});
  const [sort, setSort] = useState<string>("latest");

  const filtered = useMemo(() => {
    let list = products;
    if (debounced) {
      const q = debounced.toLowerCase();
      list = list.filter((p) => p.itemName?.toLowerCase().includes(q));
    }
    if (filters.categories?.length) list = list.filter((p) => filters.categories!.includes(p.categoryName ?? ""));
    if (filters.brands?.length) list = list.filter((p) => filters.brands!.includes(p.brandName ?? ""));
    if (filters.priceMin !== undefined) list = list.filter((p) => p.sellingPrice >= (filters.priceMin ?? 0));
    if (filters.priceMax !== undefined) list = list.filter((p) => p.sellingPrice <= (filters.priceMax ?? Infinity));
    if (filters.inStock) list = list.filter((p) => p.qty > 0);

    list = [...list].sort((a, b) => {
      if (sort === "price-asc") return a.sellingPrice - b.sellingPrice;
      if (sort === "price-desc") return b.sellingPrice - a.sellingPrice;
      if (sort === "popular") return b.qty - a.qty;
      return Number(b.id) - Number(a.id);
    });
    return list;
  }, [products, debounced, filters, sort]);

  return (
    <>
      <PageHeader title="Products" description={`${filtered.length} products found`} />
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
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="price-asc">Price: low to high</SelectItem>
                <SelectItem value="price-desc">Price: high to low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ProductGrid products={filtered} />
        </div>
      </div>
    </>
  );
}
