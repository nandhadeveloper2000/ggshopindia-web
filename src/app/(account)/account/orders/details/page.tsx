"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { OrderTimeline } from "@/components/ecommerce/OrderTimeline";
import { ordersService } from "@/services/orders.service";
import { formatCurrency, formatDate } from "@/lib/utils";

function CustomerOrderDetailsInner() {
  const sp = useSearchParams();
  const id = Number(sp.get("id"));
  const { data } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersService.get(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <>
      <PageHeader title={`Order ${data.orderNo}`} description={`Placed on ${formatDate(data.createdAt)}`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Order Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline status={data.status} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={data.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment</span>
              <StatusBadge status={data.paymentStatus} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span>{data.paymentMethod}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>{formatCurrency(data.grandTotal)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function CustomerOrderDetailsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <CustomerOrderDetailsInner />
    </Suspense>
  );
}
