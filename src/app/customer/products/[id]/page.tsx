"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePreview } from "@/components/common/ImagePreview";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { QuantityInput } from "@/components/common/QuantityInput";
import { toast } from "sonner";
import { shopProductsService } from "@/services/shopProducts.service";
import { productsService } from "@/services/products.service";
import { reviewsService } from "@/services/reviews.service";
import { useCartStore } from "@/store/cart.store";

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const product = useQuery({ queryKey: ["product", id], queryFn: () => productsService.get(id) });
  const shopProducts = useQuery({ queryKey: ["shop-products"], queryFn: () => shopProductsService.list() });
  const reviews = useQuery({ queryKey: ["reviews", id], queryFn: () => reviewsService.list(id) });

  const sp = (shopProducts.data ?? []).find((s) => s.productId === id);
  const inStock = sp ? sp.qty > 0 : true;

  if (!product.data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const handleAdd = () => {
    if (!sp) return toast.error("Not available");
    addItem({
      id: sp.id,
      productId: id,
      itemName: product.data.itemName,
      sku: product.data.sku,
      imageUrl: product.data.images?.[0],
      price: sp.sellingPrice,
      mrp: sp.mrpPrice,
      qty,
      shopId: sp.shopId,
    });
    toast.success("Added to cart");
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="aspect-square overflow-hidden rounded-md">
              <ImagePreview src={product.data.images?.[0]} alt={product.data.itemName} className="h-full w-full" />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {(product.data.images ?? []).slice(0, 4).map((img, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-md border">
                  <ImagePreview src={img} className="h-full w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div>
            <Badge variant="secondary" className="mb-2">
              {product.data.brandName ?? "Brand"}
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight">{product.data.itemName}</h1>
            <p className="text-xs text-muted-foreground mt-1">SKU: {product.data.sku}</p>
          </div>

          <PriceDisplay price={sp?.sellingPrice ?? 0} mrp={sp?.mrpPrice} size="lg" />

          <Badge variant={inStock ? "success" : "destructive"}>{inStock ? "In Stock" : "Out of Stock"}</Badge>

          <div className="flex items-center gap-3">
            <span className="text-sm">Quantity:</span>
            <QuantityInput value={qty} onChange={setQty} max={sp?.qty ?? 999} />
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="lg" className="flex-1 gap-2" onClick={handleAdd} disabled={!inStock}>
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </Button>
            <Button size="lg" variant="success" className="flex-1 gap-2" disabled={!inStock}>
              <Zap className="h-4 w-4" /> Buy Now
            </Button>
            <Button size="lg" variant="outline">
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="compat">Compatibility</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews.data?.length ?? 0})</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="text-sm space-y-1.5">
              <p><strong>Category:</strong> {product.data.categoryName ?? "—"}</p>
              <p><strong>Sub Category:</strong> {product.data.subCategoryName ?? "—"}</p>
              <p><strong>Brand:</strong> {product.data.brandName ?? "—"}</p>
              <p><strong>Model:</strong> {product.data.modelName ?? "—"}</p>
            </TabsContent>
            <TabsContent value="compat" className="text-sm">
              <p className="text-muted-foreground">Compatible with selected brand and model variants.</p>
            </TabsContent>
            <TabsContent value="reviews">
              <ul className="space-y-3">
                {(reviews.data ?? []).map((r) => (
                  <li key={r.id} className="border-b pb-3">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm">{r.customerName}</strong>
                      <span className="text-xs text-muted-foreground">{"★".repeat(r.rating)}</span>
                    </div>
                    {r.title && <p className="text-sm font-medium mt-1">{r.title}</p>}
                    <p className="text-sm text-muted-foreground">{r.comment}</p>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
