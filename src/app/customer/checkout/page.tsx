"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageHeader } from "@/components/common/PageHeader";
import { useCartStore } from "@/store/cart.store";
import { formatCurrency } from "@/lib/utils";
import { routes } from "@/lib/routes";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subTotal = useCartStore((s) => s.subTotal());
  const clear = useCartStore((s) => s.clear);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const shipping = 49;
  const tax = subTotal * 0.05;
  const grandTotal = subTotal + shipping + tax;

  const placeOrder = () => {
    toast.success("Order placed successfully");
    clear();
    router.push(routes.customer.orders);
  };

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Checkout" />
        <p className="text-sm text-muted-foreground">Your cart is empty. Add items to checkout.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Checkout" description="Complete your order" />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input />
              </div>
              <div className="space-y-1.5">
                <Label>Mobile</Label>
                <Input />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address</Label>
                <Textarea rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input />
              </div>
              <div className="space-y-1.5">
                <Label>Pincode</Label>
                <Input />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid gap-2 sm:grid-cols-2">
                {[
                  { value: "CASH", label: "Cash on Delivery" },
                  { value: "UPI", label: "UPI" },
                  { value: "CARD", label: "Card" },
                  { value: "BANK_TRANSFER", label: "Bank Transfer" },
                ].map((p) => (
                  <label key={p.value} className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:border-primary">
                    <RadioGroupItem value={p.value} />
                    <span className="text-sm">{p.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <Card className="self-start sticky top-20">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-base font-semibold">Order summary</h3>
            <ul className="space-y-1 text-sm">
              {items.map((i) => (
                <li key={String(i.id)} className="flex justify-between">
                  <span className="text-muted-foreground">{i.itemName} × {i.qty}</span>
                  <span>{formatCurrency(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-1 border-t pt-2 text-sm">
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
            <Button className="w-full" onClick={placeOrder}>
              Place Order
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
