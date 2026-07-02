"use client";

import { useParams } from "next/navigation";
import { ProductFormView } from "@/components/products/ProductFormView";

export default function EditProductClient() {
  const params = useParams<{ id: string }>();
  return <ProductFormView productId={params.id} />;
}
