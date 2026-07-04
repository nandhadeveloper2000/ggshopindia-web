"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProductFormView } from "@/components/products/ProductFormView";

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
      <EditProductView />
    </Suspense>
  );
}

function EditProductView() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id") ?? "";
  return <ProductFormView productId={productId} />;
}
