"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ShopProduct } from "@/types/product.types";

interface Props {
  rows: ShopProduct[];
}

export function LowStockTable({ rows }: Props) {
  const low = rows.filter((r) => r.lowStockQty !== undefined && r.qty <= (r.lowStockQty ?? 0)).slice(0, 6);
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Threshold</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {low.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                All stock above threshold
              </TableCell>
            </TableRow>
          ) : (
            low.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.itemName}</TableCell>
                <TableCell>{r.sku}</TableCell>
                <TableCell className="text-right">{r.qty}</TableCell>
                <TableCell className="text-right">{r.lowStockQty}</TableCell>
                <TableCell>
                  <Badge variant={r.qty === 0 ? "destructive" : "warning"}>{r.qty === 0 ? "Out of stock" : "Low"}</Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
