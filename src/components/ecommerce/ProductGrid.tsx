"use client";

import { ProductCard } from "./ProductCard";
import { EmptyState } from "@/components/common/EmptyState";
import type { ShopProduct } from "@/types/product.types";

interface Props {
  products: ShopProduct[];
}

export function ProductGrid({ products }: Props) {
  if (products.length === 0) return <EmptyState title="No products found" description="Try adjusting your filters." />;
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
