"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProductDetailsView } from "@/components/products/ProductDetailsView";

function Fallback() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Fallback />}>
      <ViewProductRoute />
    </Suspense>
  );
}

function ViewProductRoute() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id") ?? "";
  return <ProductDetailsView productId={productId} />;
}
