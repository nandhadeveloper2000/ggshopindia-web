"use client";
import { Badge } from "@/components/ui/badge";

type Variant = "default" | "secondary" | "destructive" | "success" | "warning" | "outline";

const STATUS_MAP: Record<string, Variant> = {
  ACTIVE: "success",
  INACTIVE: "secondary",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  PLACED: "outline",
  CONFIRMED: "default",
  PACKED: "default",
  SHIPPED: "default",
  DELIVERED: "success",
  CANCELLED: "destructive",
  RETURNED: "destructive",
  PAID: "success",
  PARTIAL: "warning",
  IN_STOCK: "success",
  LOW_STOCK: "warning",
  OUT_OF_STOCK: "destructive",
  DRAFT: "secondary",
  COMPLETED: "success",
};

interface Props {
  status: string | boolean;
}

export function StatusBadge({ status }: Props) {
  if (typeof status === "boolean") {
    return <Badge variant={status ? "success" : "secondary"}>{status ? "Active" : "Inactive"}</Badge>;
  }
  const key = (status ?? "").toUpperCase();
  const variant = STATUS_MAP[key] ?? "outline";
  return <Badge variant={variant}>{key.replace(/_/g, " ")}</Badge>;
}
