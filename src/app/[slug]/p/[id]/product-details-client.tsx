"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Share2, ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { QuantityInput } from "@/components/common/QuantityInput";
import { WishlistButton } from "@/components/ecommerce/WishlistButton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { shopProductsService } from "@/services/shopProducts.service";
import { productsService } from "@/services/products.service";
import { attributeTemplatesService } from "@/services/attribute-templates.service";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useLocationStore } from "@/store/location.store";
import { searchOsm } from "@/lib/osm";
import { routes } from "@/lib/routes";
import type { Product } from "@/types/product.types";
import { ProductGallery } from "./product-gallery";
import { SellerCard, SellersDialog } from "./sellers-dialog";
import { ProductSpecs } from "./product-specs";

interface ColorVariant {
  color: string;
  images: string[];
  ram?: string;
  storage?: string;
  inStock: boolean;
}

interface VariantPayload {
  rows?: Array<{ combo?: Record<string, string>; images?: string[]; status?: string }>;
}

/** Colour options: the base product (from dynamic fields) + each variant row. */
function getColorVariants(product: Product): ColorVariant[] {
  const df = product.dynamicFields ?? {};
  const out: ColorVariant[] = [
    { color: df.color ?? "Default", images: product.images ?? [], ram: df.ram, storage: df.internalstorage, inStock: true },
  ];
  const v = product.variant as VariantPayload | undefined;
  v?.rows?.forEach((row) => {
    out.push({
      color: row.combo?.color ?? "Variant",
      images: row.images ?? [],
      ram: row.combo?.ram,
      storage: row.combo?.internalstorage,
      inStock: (row.status ?? "Available").toLowerCase() === "available",
    });
  });
  return out;
}

/** "128 GB + 6 GB" (storage + RAM, without the redundant "RAM" word). */
function variantLabel(c?: ColorVariant): string {
  if (!c) return "";
  const ram = c.ram ? c.ram.replace(/\s*RAM\s*/i, "").trim() : "";
  return [c.storage, ram].filter(Boolean).join(" + ");
}

/**
 * PUBLIC product detail body for `/{slug}/p/{id}`. The product id comes from the
 * route param (passed in as `id`); the slug is cosmetic. Pricing/stock come from
 * the public shop-products endpoint and reviews from the public reviews endpoint,
 * so guests see full details without signing in.
 */
export default function ProductDetailsClient({ id }: { id: string }) {
  const enabled = id.length > 0;
  const [qty, setQty] = useState(1);
  const [colorIdx, setColorIdx] = useState(0);
  const [selectedSellerId, setSelectedSellerId] = useState<string | undefined>(undefined);
  const [sellersOpen, setSellersOpen] = useState(false);
  const colorParam = useSearchParams().get("color");
  const custLat = useLocationStore((s) => s.lat);
  const custLng = useLocationStore((s) => s.lng);
  const pincode = useLocationStore((s) => s.pincode);
  const { addToCart, buyNow } = useAddToCart();

  const product = useQuery({ queryKey: ["product", id], queryFn: () => productsService.get(id), enabled });
  // The product's attribute template drives the spec sections (per product type).
  const templateQuery = useQuery({
    queryKey: ["attr-template", product.data?.categoryId, product.data?.subCategoryId, product.data?.productTypeId],
    queryFn: () =>
      attributeTemplatesService.getBySelection(
        product.data!.categoryId!,
        product.data!.subCategoryId!,
        product.data!.productTypeId!,
      ),
    enabled: Boolean(product.data?.categoryId && product.data?.subCategoryId && product.data?.productTypeId),
    retry: false,
  });
  const sellersQuery = useQuery({
    queryKey: ["product-sellers", id],
    queryFn: () => shopProductsService.sellersForProduct(id),
    enabled,
    retry: false,
  });

  // If the saved location has no coordinates (pincode-only), geocode the pincode
  // so we can still show the distance to each shop.
  const geoQuery = useQuery({
    queryKey: ["geocode-pin", pincode],
    queryFn: async () => {
      const fill = (await searchOsm(`${pincode}, India`))[0]?.fill;
      return fill?.latitude && fill?.longitude
        ? { lat: Number(fill.latitude), lng: Number(fill.longitude) }
        : null;
    },
    enabled: custLat == null && !!pincode,
    retry: false,
    staleTime: Infinity,
  });
  const effLat = custLat ?? geoQuery.data?.lat ?? null;
  const effLng = custLng ?? geoQuery.data?.lng ?? null;

  // Pre-select the colour passed from a listing card (?color=…).
  useEffect(() => {
    if (!product.data || !colorParam) return;
    const idx = getColorVariants(product.data).findIndex(
      (v) => v.color.toLowerCase() === colorParam.toLowerCase(),
    );
    if (idx > 0) setColorIdx(idx);
  }, [product.data, colorParam]);

  // Default the chosen seller to the cheapest once sellers load.
  useEffect(() => {
    const list = sellersQuery.data ?? [];
    if (list.length && !list.some((s) => String(s.id) === selectedSellerId)) {
      setSelectedSellerId(String(list[0].id));
    }
  }, [sellersQuery.data, selectedSellerId]);

  const sellers = sellersQuery.data ?? [];
  const selected = sellers.find((s) => String(s.id) === selectedSellerId) ?? sellers[0];
  const inStock = !!selected?.inStock;
  const canBuyNow = !!selected?.deliveryAvailable && inStock;

  if (!product.data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const colorVariants = getColorVariants(product.data);
  const current = colorVariants[Math.min(colorIdx, colorVariants.length - 1)] ?? colorVariants[0];

  // Descriptive title, Reliance/Flipkart style: "{name}, {RAM} RAM, {storage} Storage, {colour}, Smartphone".
  const ramText = current.ram ? current.ram.replace(/\s*RAM\s*/i, "").trim() : "";
  const fullTitle = [
    product.data.itemName,
    ramText ? `${ramText} RAM` : "",
    current.storage ? `${current.storage} Storage` : "",
    ["Default", "Variant"].includes(current.color) ? "" : current.color,
    "Smartphone",
  ]
    .filter(Boolean)
    .join(", ");

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: product.data!.itemName, url });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      /* share dialog cancelled — ignore */
    }
  };

  const categoryHref = product.data.categoryId
    ? routes.customer.category(product.data.categoryId, product.data.categoryName)
    : routes.customer.products;

  const cartItem = () => ({
    id: selected!.id,
    productId: id,
    itemName: product.data!.itemName,
    sku: product.data!.sku,
    imageUrl: product.data!.images?.[0],
    price: selected!.sellingPrice,
    mrp: selected!.mrp,
    qty,
    shopId: selected!.shopId,
  });

  const handleAdd = () => {
    if (!selected) return toast.error("Not available");
    addToCart(cartItem());
  };

  const handleBuyNow = () => {
    if (!selected) return toast.error("Not available");
    buyNow(cartItem());
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb: Home › Category › Brand › Product */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
        <Link href="/" className="transition hover:text-primary">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <Link href={categoryHref} className="transition hover:text-primary">
          {product.data.categoryName ?? "Products"}
        </Link>
        {product.data.brandName && (
          <>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span>{product.data.brandName}</span>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="line-clamp-1 font-medium text-foreground">{product.data.itemName}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      {/* Left: image gallery + primary actions (Flipkart-style, sticky) */}
      <div className="space-y-3 self-start lg:sticky lg:top-20">
        <Card>
          <CardContent className="p-4">
            <ProductGallery key={colorIdx} images={current.images} alt={product.data.itemName} />
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button className="h-12 flex-1 gap-2 text-base" onClick={handleAdd} disabled={!inStock}>
            <ShoppingCart className="h-5 w-5" /> Add to Cart
          </Button>
          {canBuyNow && (
            <Button variant="success" className="h-12 flex-1 gap-2 text-base" onClick={handleBuyNow}>
              <Zap className="h-5 w-5" /> Buy Now
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {product.data.brandName && (
              <p className="mb-1 text-sm font-semibold text-primary">{product.data.brandName}</p>
            )}
            <h1 className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{fullTitle}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <WishlistButton productId={id} variant="outline" className="h-10 w-10 rounded-full" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={handleShare}
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <PriceDisplay price={selected?.sellingPrice ?? 0} mrp={selected?.mrp} size="lg" />
          <p className="text-xs text-muted-foreground">Inclusive of all taxes</p>
          <Badge variant={inStock ? "success" : "destructive"}>{inStock ? "In Stock" : "Out of Stock"}</Badge>
        </div>

        {/* Colour selector — swaps the whole gallery (main image + thumbnails) */}
        {colorVariants.length > 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Selected Color: <span className="text-primary">{current.color}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {colorVariants.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setColorIdx(i)}
                  title={c.color}
                  aria-label={c.color}
                  aria-current={i === colorIdx}
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-white transition",
                    i === colorIdx ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/60",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.images[0]} alt={c.color} className="h-full w-full object-contain p-1" />
                  {!c.inStock && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-center text-[10px] font-semibold leading-tight text-destructive">
                      Out of stock
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Variant (storage + RAM) */}
        {variantLabel(current) && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Variant: <span className="text-muted-foreground">{variantLabel(current)}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-primary bg-primary/5 px-3 py-2 text-sm font-medium text-primary"
              >
                {variantLabel(current)}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="text-sm">Quantity:</span>
          <QuantityInput value={qty} onChange={setQty} max={selected?.availableQuantity ?? 999} />
        </div>

        {/* Sold by — selected seller + "See all sellers" sheet */}
        {selected && (
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                Sold by <span className="font-normal text-muted-foreground">({sellers.length})</span>
              </p>
              <button
                type="button"
                onClick={() => setSellersOpen(true)}
                className="shrink-0 text-xs font-semibold text-primary hover:underline"
              >
                See all sellers →
              </button>
            </div>
            <SellerCard s={selected} lat={effLat} lng={effLng} />
          </div>
        )}
      </div>
      </div>

      {/* Full spec sheet: Apple-style expandable details + image, tabbed */}
      <ProductSpecs
        product={product.data}
        image={current.images?.[0] ?? product.data.images?.[0]}
        template={templateQuery.data}
      />

      <SellersDialog
        open={sellersOpen}
        onOpenChange={setSellersOpen}
        sellers={sellers}
        selectedId={selectedSellerId}
        onSelect={setSelectedSellerId}
        productName={fullTitle}
        productImage={current.images?.[0] ?? product.data.images?.[0]}
        onAdd={() => {
          handleAdd();
          setSellersOpen(false);
        }}
        onBuy={() => {
          handleBuyNow();
          setSellersOpen(false);
        }}
        lat={effLat}
        lng={effLng}
      />
    </div>
  );
}
