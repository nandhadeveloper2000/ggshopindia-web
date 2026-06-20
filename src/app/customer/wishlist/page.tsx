"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { ImagePreview } from "@/components/common/ImagePreview";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { EmptyState } from "@/components/common/EmptyState";
import { wishlistService } from "@/services/wishlist.service";
import { useCartStore } from "@/store/cart.store";

export default function WishlistPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["wishlist"], queryFn: wishlistService.list });
  const addItem = useCartStore((s) => s.addItem);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["wishlist"] });

  return (
    <>
      <PageHeader title="Wishlist" description={`${data.length} item${data.length !== 1 ? "s" : ""}`} />
      {data.length === 0 ? (
        <EmptyState icon={Heart} title="Your wishlist is empty" description="Save items you love for later." />
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((w) => (
            <Card key={w.id} className="overflow-hidden">
              <div className="aspect-square">
                <ImagePreview src={w.imageUrl} alt={w.itemName} className="h-full w-full" />
              </div>
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium line-clamp-2">{w.itemName}</p>
                <PriceDisplay price={w.price} mrp={w.mrp} size="sm" />
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => {
                      addItem({
                        id: w.id,
                        productId: w.productId,
                        itemName: w.itemName,
                        sku: "",
                        imageUrl: w.imageUrl,
                        price: w.price,
                        mrp: w.mrp,
                        qty: 1,
                      });
                      toast.success("Moved to cart");
                    }}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Cart
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 text-destructive"
                    onClick={async () => {
                      await wishlistService.remove(w.id);
                      invalidate();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
