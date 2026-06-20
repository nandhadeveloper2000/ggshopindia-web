"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banknote, CreditCard, Plus, Printer, QrCode, Receipt, Search, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImagePreview } from "@/components/common/ImagePreview";
import { QuantityInput } from "@/components/common/QuantityInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { shopProductsService } from "@/services/shopProducts.service";
import { customersService } from "@/services/customers.service";
import { formatCurrency } from "@/lib/utils";
import type { ShopProduct } from "@/types/product.types";

interface PosLine {
  productId: number | string;
  itemName: string;
  sku: string;
  price: number;
  qty: number;
  imageUrl?: string;
}

const PAYMENT_METHODS = [
  { key: "CASH", label: "Cash", icon: Banknote, shortcut: "Space" },
  { key: "SPLIT", label: "Split", icon: Wallet, shortcut: "F2" },
  { key: "CARD", label: "Card", icon: CreditCard, shortcut: "F3" },
  { key: "UPI", label: "UPI", icon: QrCode, shortcut: "F4" },
  { key: "CREDIT", label: "Credit", icon: Receipt, shortcut: "F5" },
];

export default function PosBillingPage() {
  const { data: products = [] } = useQuery({ queryKey: ["shop-products"], queryFn: () => shopProductsService.list() });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersService.list });

  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<PosLine[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [discount, setDiscount] = useState(0);
  const [taxPct, setTaxPct] = useState(5);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 12);
    return products
      .filter((p) => (p.itemName ?? "").toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.itemCode ?? "").toLowerCase().includes(q))
      .slice(0, 24);
  }, [products, search]);

  const addProduct = (p: ShopProduct) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { productId: p.id, itemName: p.itemName ?? p.sku, sku: p.sku, price: p.sellingPrice, qty: 1, imageUrl: p.imageUrl }];
    });
  };

  const subTotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const taxAmount = ((subTotal - discount) * taxPct) / 100;
  const grandTotal = Math.max(0, subTotal - discount + taxAmount);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (lines.length === 0) return;
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setPaymentMethod("CASH");
        setPaymentOpen(true);
      }
      if (e.key === "F2") {
        e.preventDefault();
        setPaymentMethod("SPLIT");
        setPaymentOpen(true);
      }
      if (e.key === "F3") {
        e.preventDefault();
        setPaymentMethod("CARD");
        setPaymentOpen(true);
      }
      if (e.key === "F4") {
        e.preventDefault();
        setPaymentMethod("UPI");
        setPaymentOpen(true);
      }
      if (e.key === "F5") {
        e.preventDefault();
        setPaymentMethod("CREDIT");
        setPaymentOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lines.length]);

  const completePayment = () => {
    toast.success(`Invoice generated · ${paymentMethod} · ${formatCurrency(grandTotal)}`);
    setPaymentOpen(false);
    setLines([]);
    setDiscount(0);
  };

  return (
    <>
      <PageHeader title="POS Billing" description="Quick sale entry with keyboard shortcuts." />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <Card>
            <CardContent className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Scan barcode or search by name / SKU / code…"
                  className="pl-9 h-11 text-base"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                className="group flex flex-col rounded-lg border bg-card p-2 text-left transition hover:border-primary"
              >
                <div className="aspect-square w-full overflow-hidden rounded-md">
                  <ImagePreview src={p.imageUrl} alt={p.itemName} className="h-full w-full" />
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-medium">{p.itemName}</p>
                <p className="text-[10px] text-muted-foreground">{p.sku}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">{formatCurrency(p.sellingPrice)}</span>
                  <Badge variant={p.qty === 0 ? "destructive" : "outline"} className="text-[10px]">
                    {p.qty} {p.unit ?? ""}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Card className="self-start sticky top-20">
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Walk-in customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">Walk-in customer</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} {c.mobile ? `· ${c.mobile}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {lines.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-6">Cart is empty</p>
              ) : (
                lines.map((l) => (
                  <div key={String(l.productId)} className="flex items-center gap-2 rounded border p-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-medium">{l.itemName}</p>
                      <p className="text-[10px] text-muted-foreground">{l.sku}</p>
                    </div>
                    <QuantityInput
                      value={l.qty}
                      onChange={(v) => setLines((p) => p.map((x) => (x.productId === l.productId ? { ...x, qty: v } : x)))}
                    />
                    <div className="w-20 text-right text-xs font-semibold">{formatCurrency(l.price * l.qty)}</div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setLines((p) => p.filter((x) => x.productId !== l.productId))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <div className="space-y-1.5">
                <Label className="text-xs">Discount</Label>
                <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} className="h-8" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tax %</Label>
                <Input type="number" value={taxPct} onChange={(e) => setTaxPct(Number(e.target.value) || 0)} className="h-8" />
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold text-base">
                <span>Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {PAYMENT_METHODS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.key}
                    onClick={() => {
                      if (lines.length === 0) return toast.error("Cart is empty");
                      setPaymentMethod(p.key);
                      setPaymentOpen(true);
                    }}
                    className="flex flex-col items-center gap-0.5 rounded-md border p-2 text-xs hover:bg-primary hover:text-primary-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{p.label}</span>
                    <kbd className="text-[9px] text-muted-foreground">{p.shortcut}</kbd>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment — {paymentMethod}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Customer</span>
              <span>{customers.find((c) => String(c.id) === customerId)?.name ?? "Walk-in"}</span>
            </div>
            <div className="flex justify-between">
              <span>Items</span>
              <span>{lines.length}</span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t pt-2">
              <span>Amount Due</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={completePayment} className="gap-2">
              <Printer className="h-4 w-4" /> Complete & Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {lines.length === 0 && filtered.length === 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Plus className="mx-auto mb-2 h-6 w-6" /> No products found
        </div>
      )}
    </>
  );
}
