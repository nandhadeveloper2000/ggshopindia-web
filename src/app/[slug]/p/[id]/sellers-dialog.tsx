"use client";

import { Check, MapPin, Navigation, Phone, ShoppingCart, Store, Truck, Zap } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, haversineKm } from "@/lib/utils";
import type { ProductSeller } from "@/services/shopProducts.service";

/** Directions URL to a shop (by coordinates, falling back to a name search). */
function directionsUrl(s: ProductSeller): string {
  return s.shopLatitude != null && s.shopLongitude != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${s.shopLatitude},${s.shopLongitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${s.shopName ?? ""} ${s.shopLocation ?? ""}`.trim(),
      )}`;
}

/** Seller info block: name, location · distance, mobile, price, delivery/stock, directions. */
export function SellerCard({ s, lat, lng }: { s: ProductSeller; lat: number | null; lng: number | null }) {
  const dist =
    lat != null && lng != null && s.shopLatitude != null && s.shopLongitude != null
      ? haversineKm(lat, lng, s.shopLatitude, s.shopLongitude)
      : null;
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{s.shopName ?? "Shop"}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {(s.shopLocation || dist != null) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {s.shopLocation}
                {dist != null && <span className="font-medium text-foreground">· {dist.toFixed(1)} km</span>}
              </span>
            )}
            {s.shopMobile && (
              <a
                href={`tel:${s.shopMobile}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 transition hover:text-primary"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" /> {s.shopMobile}
              </a>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-base font-bold leading-tight">{formatCurrency(s.sellingPrice)}</p>
          {s.mrp != null && s.mrp > s.sellingPrice && (
            <p className="text-xs text-muted-foreground line-through">{formatCurrency(s.mrp)}</p>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
            s.deliveryAvailable ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground",
          )}
        >
          <Truck className="h-3 w-3" /> {s.deliveryAvailable ? "Delivery available" : "No delivery"}
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
            s.inStock ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-destructive",
          )}
        >
          {s.inStock ? "In stock" : "Out of stock"}
        </span>
      </div>
      {!s.deliveryAvailable && (
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
          <span className="inline-flex items-center gap-1 font-medium">
            <Store className="h-3.5 w-3.5 shrink-0" /> No delivery — visit shop to buy
          </span>
          <a
            href={directionsUrl(s)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 font-semibold text-primary transition hover:underline"
          >
            <Navigation className="h-3 w-3" /> Directions
          </a>
        </div>
      )}
    </>
  );
}

interface SellersDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sellers: ProductSeller[];
  selectedId?: string;
  onSelect: (id: string) => void;
  productName: string;
  productImage?: string;
  onAdd: () => void;
  onBuy: () => void;
  lat: number | null;
  lng: number | null;
}

/**
 * Flipkart-style "All Sellers" popup: pick a seller (cheapest first), then Add to
 * Cart or Buy Now for that seller. Buy Now is hidden when the selected seller has
 * no delivery (the shopper must visit the shop — use its Directions link instead).
 */
export function SellersDialog({
  open,
  onOpenChange,
  sellers,
  selectedId,
  onSelect,
  productName,
  productImage,
  onAdd,
  onBuy,
  lat,
  lng,
}: SellersDialogProps) {
  const selected = sellers.find((s) => String(s.id) === selectedId) ?? sellers[0];
  const canBuyNow = !!selected?.deliveryAvailable && !!selected?.inStock;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetTitle className="border-b px-4 py-3 pr-10 text-base font-semibold">All Sellers</SheetTitle>
        <SheetDescription className="sr-only">Choose a seller for {productName}.</SheetDescription>

        <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border bg-white">
            {productImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={productImage} alt="" className="h-full w-full object-contain" />
            ) : (
              <Store className="h-5 w-5 text-muted-foreground" />
            )}
          </span>
          <p className="line-clamp-2 text-sm font-medium">{productName}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-3">
          <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Sellers by price
          </p>
          <div className="space-y-2">
            {sellers.map((s) => {
              const isSel = String(s.id) === String(selected?.id);
              return (
                <div
                  key={String(s.id)}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(String(s.id))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(String(s.id));
                    }
                  }}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-lg border p-3 transition",
                    isSel ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      isSel ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                    )}
                  >
                    {isSel && <Check className="h-3 w-3" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <SellerCard s={s} lat={lat} lng={lng} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 border-t p-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={onAdd} disabled={!selected?.inStock}>
            <ShoppingCart className="h-4 w-4" /> Add to Cart
          </Button>
          {canBuyNow && (
            <Button variant="success" className="flex-1 gap-2" onClick={onBuy}>
              <Zap className="h-4 w-4" /> Buy Now
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
