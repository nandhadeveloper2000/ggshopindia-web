"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Barcode as BarcodeIcon, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shopProductsService } from "@/services/shopProducts.service";

export default function StaffBarcodePage() {
  const { data: products = [] } = useQuery({ queryKey: ["shop-products"], queryFn: () => shopProductsService.list() });
  const [productId, setProductId] = useState<string>("");
  const [count, setCount] = useState(1);
  const selected = products.find((p) => String(p.id) === productId);

  return (
    <>
      <PageHeader title="Barcode" description="Print barcodes / QR labels for stock." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="space-y-1.5">
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.itemName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Print Count</Label>
              <Input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} />
            </div>
            <Button className="w-full gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="rounded border p-6 flex flex-col items-center gap-2">
              <BarcodeIcon className="h-16 w-16" />
              <QrCode className="h-12 w-12 text-muted-foreground" />
              {selected ? (
                <>
                  <p className="text-sm font-medium mt-1">{selected.itemName}</p>
                  <p className="text-xs text-muted-foreground">{selected.sku}</p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Select product to preview</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
