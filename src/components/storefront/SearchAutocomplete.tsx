"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpLeft, Search, Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { productsService } from "@/services/products.service";
import { routes } from "@/lib/routes";

/**
 * Reliance/Flipkart-style header search with a live autocomplete dropdown:
 * brand suggestions, "{brand} in {category}" suggestions, and matching products
 * with thumbnails. Powered by the backend `/api/products/search` (Postgres
 * full-text + trigram). Enter or a suggestion click opens `/products?q=…`.
 */
export function SearchAutocomplete() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(q, 250);
  const boxRef = useRef<HTMLDivElement>(null);

  const term = debounced.trim();
  const { data } = useQuery({
    queryKey: ["product-search", term],
    queryFn: () => productsService.search(term),
    enabled: term.length >= 2,
    retry: false,
  });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = (t: string) => {
    const v = t.trim();
    if (!v) return;
    setOpen(false);
    router.push(`${routes.customer.products}?q=${encodeURIComponent(v)}`);
  };

  const brands = data?.brands ?? [];
  const categories = data?.categories ?? [];
  const products = data?.products ?? [];
  const showDropdown = open && term.length >= 2 && brands.length + categories.length + products.length > 0;

  const row =
    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground transition hover:bg-accent";

  return (
    <div ref={boxRef} className="relative flex-1 md:max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search Products & Brands"
          autoComplete="off"
          className="h-10 w-full rounded-md border-0 bg-white pl-11 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-white/60"
        />
      </form>

      {showDropdown && (
        <div className="absolute inset-x-0 top-12 z-50 max-h-[70vh] overflow-auto rounded-lg border bg-white text-foreground shadow-xl">
          {brands.map((b) => (
            <button key={`b-${b.id}`} type="button" onClick={() => go(b.name)} className={row}>
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {b.name} <span className="text-muted-foreground">(Brand)</span>
              </span>
              <ArrowUpLeft className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}

          {categories.map((c) => (
            <button
              key={`c-${c.id}`}
              type="button"
              onClick={() => go(c.brandName ? `${c.brandName} ${c.name}` : c.name)}
              className={row}
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {c.brandName ? (
                  <>
                    {c.brandName} <span className="text-muted-foreground">in {c.name}</span>
                  </>
                ) : (
                  c.name
                )}
              </span>
              <ArrowUpLeft className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}

          {products.length > 0 && (
            <p className="border-t px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Products
            </p>
          )}
          {products.map((p) => (
            <Link
              key={`p-${p.id}`}
              href={routes.customer.productDetails(p.id, p.name)}
              onClick={() => setOpen(false)}
              className={row}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded border bg-white">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="h-full w-full object-contain" />
                ) : (
                  <Store className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
              <span className="line-clamp-1">{p.name}</span>
              <ArrowUpLeft className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
