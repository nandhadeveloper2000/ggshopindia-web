"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/ecommerce/ProductGrid";
import { shopProductsService } from "@/services/shopProducts.service";
import { categoriesService } from "@/services/catalog.service";
import { routes } from "@/lib/routes";

export default function CustomerHomePage() {
  const { data: products = [] } = useQuery({ queryKey: ["shop-products"], queryFn: () => shopProductsService.list() });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-gradient-to-r from-primary to-primary-hover px-6 py-10 text-primary-foreground lg:px-10 lg:py-14">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Quality parts. Fast delivery. Trusted shops.
          </h1>
          <p className="text-primary-foreground/80 text-sm lg:text-base">
            Shop genuine parts and accessories from verified retailers and distributors.
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search for products…" className="h-10 pl-9 bg-white text-foreground" />
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Shop by Category</h2>
          <Button variant="link" asChild>
            <Link href={routes.customer.products}>
              All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {categories.slice(0, 5).map((c) => (
            <Card key={c.id} className="overflow-hidden cursor-pointer transition hover:border-primary">
              <CardContent className="p-4 text-center">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.description ?? ""}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Featured Products</h2>
          <Button variant="link" asChild>
            <Link href={routes.customer.products}>
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <ProductGrid products={products.slice(0, 10)} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Latest Products</h2>
        <ProductGrid products={products.slice().reverse().slice(0, 5)} />
      </section>
    </div>
  );
}
