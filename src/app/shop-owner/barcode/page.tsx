"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QrCode, Barcode as BarcodeIcon, Printer } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shopProductsService } from "@/services/shopProducts.service";

export default function BarcodePage() {
  const { data: products = [] } = useQuery({ queryKey: ["shop-products"], queryFn: () => shopProductsService.list() });
  const [productId, setProductId] = useState<string>("");
  const [type, setType] = useState<"BARCODE" | "QR">("BARCODE");
  const [count, setCount] = useState(1);
  const [width, setWidth] = useState(60);
  const [height, setHeight] = useState(30);
  const [batch, setBatch] = useState("");

  const selected = products.find((p) => String(p.id) === productId);

  return (
    <>
      <PageHeader title="Barcode / QR Code" description="Generate barcodes and QR codes for your inventory." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.itemName} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Batch</Label>
              <Input value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "BARCODE" | "QR")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BARCODE">Barcode</SelectItem>
                  <SelectItem value="QR">QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Label Width (mm)</Label>
              <Input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Label Height (mm)</Label>
              <Input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Print Count</Label>
              <Input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} />
            </div>
            <Button className="sm:col-span-2 gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print {count} labels
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Preview</h3>
            {selected ? (
              <div className="flex flex-col items-center gap-3 rounded border p-6">
                <div className="flex h-24 w-48 items-center justify-center bg-white border rounded-sm">
                  {type === "BARCODE" ? <BarcodeIcon className="h-16 w-16" /> : <QrCode className="h-16 w-16" />}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{selected.itemName}</p>
                  <p className="text-xs text-muted-foreground">{selected.sku}</p>
                  {batch && <p className="text-xs text-muted-foreground">Batch: {batch}</p>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a product to preview.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
