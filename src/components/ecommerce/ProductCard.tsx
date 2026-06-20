"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePreview } from "@/components/common/ImagePreview";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { routes } from "@/lib/routes";
import { useCartStore } from "@/store/cart.store";
import { toast } from "sonner";
import type { ShopProduct } from "@/types/product.types";

interface Props {
  product: ShopProduct;
}

export function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    addItem({
      id: product.id,
      productId: product.productId,
      itemName: product.itemName ?? "",
      sku: product.sku,
      imageUrl: product.imageUrl,
      price: product.sellingPrice,
      mrp: product.mrpPrice,
      qty: 1,
      shopId: product.shopId,
    });
    toast.success("Added to cart");
  };

  return (
    <Card className="overflow-hidden group">
      <Link href={routes.customer.productDetails(product.productId)}>
        <div className="aspect-square overflow-hidden">
          <ImagePreview src={product.imageUrl} alt={product.itemName} className="h-full w-full transition group-hover:scale-105" />
        </div>
      </Link>
      <CardContent className="p-3 space-y-2">
        <div>
          <Link href={routes.customer.productDetails(product.productId)} className="line-clamp-2 text-sm font-medium hover:text-primary">
            {product.itemName}
          </Link>
          <p className="text-xs text-muted-foreground">{product.brandName ?? "—"}</p>
        </div>
        <PriceDisplay price={product.sellingPrice} mrp={product.mrpPrice} size="sm" />
        <div className="flex gap-1.5">
          <Button size="sm" className="flex-1 gap-1.5" onClick={handleAdd}>
            <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
          </Button>
          <Button size="icon" variant="outline" className="h-9 w-9">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
