"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { ImagePreview } from "@/components/common/ImagePreview";
import { EmptyState } from "@/components/common/EmptyState";
import { wishlistService } from "@/services/wishlist.service";
import { productsService } from "@/services/products.service";
import { useAuthStore } from "@/store/auth.store";
import { routes } from "@/lib/routes";

export default function WishlistPage() {
  const qc = useQueryClient();
  const customerId = useAuthStore((s) => s.user?.id);

  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist", customerId],
    queryFn: () => wishlistService.list(customerId!),
    enabled: !!customerId,
  });

  // Wishlist rows carry only ids; enrich name/image from the master catalog.
  const { data: products = [] } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productsService.list(),
  });

  const items = wishlist.map((w) => ({
    ...w,
    product: products.find((p) => String(p.id) === String(w.productId)),
  }));

  const remove = async (productId: string | number) => {
    if (!customerId) return;
    try {
      await wishlistService.remove(customerId, productId);
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Could not remove item. Please try again.");
    }
  };

  return (
    <>
      <PageHeader
        title="Wishlist"
        description={`${items.length} item${items.length !== 1 ? "s" : ""}`}
      />
      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save items you love for later."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((w) => (
            <Card key={w.id} className="group overflow-hidden">
              <Link href={routes.customer.productDetails(w.productId, w.product?.itemName)}>
                <div className="aspect-square">
                  <ImagePreview
                    src={w.product?.images?.[0]}
                    alt={w.product?.itemName ?? "Product"}
                    className="h-full w-full transition group-hover:scale-105"
                  />
                </div>
              </Link>
              <CardContent className="space-y-2 p-3">
                <div>
                  <Link
                    href={routes.customer.productDetails(w.productId, w.product?.itemName)}
                    className="line-clamp-2 text-sm font-medium hover:text-primary"
                  >
                    {w.product?.itemName ?? "Product"}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {w.product?.brandName ?? "—"}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={routes.customer.productDetails(w.productId, w.product?.itemName)}>View</Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 text-destructive"
                    aria-label="Remove from wishlist"
                    onClick={() => remove(w.productId)}
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
