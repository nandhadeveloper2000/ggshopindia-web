"use client";

import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ImagePreview } from "@/components/common/ImagePreview";
import { QuantityInput } from "@/components/common/QuantityInput";
import { useCartStore } from "@/store/cart.store";
import { formatCurrency } from "@/lib/utils";
import { routes } from "@/lib/routes";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const subTotal = useCartStore((s) => s.subTotal());

  const shipping = items.length > 0 ? 49 : 0;
  const tax = subTotal * 0.05;
  const grandTotal = subTotal + shipping + tax;

  return (
    <>
      <PageHeader title="Cart" description={`${items.length} item${items.length !== 1 ? "s" : ""} in your cart`} />
      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse our products and add items to your cart."
          action={
            <Button asChild>
              <Link href={routes.customer.products}>Continue Shopping</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-2">
            {items.map((i) => (
              <Card key={String(i.id)}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="h-20 w-20 shrink-0">
                    <ImagePreview src={i.imageUrl} alt={i.itemName} className="h-full w-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{i.itemName}</p>
                    <p className="text-xs text-muted-foreground">SKU: {i.sku}</p>
                    <p className="text-sm font-semibold mt-1">{formatCurrency(i.price)}</p>
                  </div>
                  <QuantityInput value={i.qty} onChange={(v) => updateQty(i.productId, v)} />
                  <div className="w-24 text-right text-sm font-semibold">{formatCurrency(i.price * i.qty)}</div>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeItem(i.productId)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="self-start sticky top-20">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-base font-semibold">Order summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold text-base">
                  <span>Total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Discount code" />
                <Button variant="outline">Apply</Button>
              </div>
              <Button asChild className="w-full">
                <Link href={routes.customer.checkout}>Proceed to Checkout</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
