"use client";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface Props {
  price: number;
  mrp?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PriceDisplay({ price, mrp, className, size = "md" }: Props) {
  const showDiscount = typeof mrp === "number" && mrp > price;
  const discount = showDiscount ? Math.round(((mrp! - price) / mrp!) * 100) : 0;
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-semibold text-foreground", sizes[size])}>{formatCurrency(price)}</span>
      {showDiscount && (
        <>
          <span className="text-xs text-muted-foreground line-through">{formatCurrency(mrp!)}</span>
          <span className="text-xs font-medium text-success">{discount}% OFF</span>
        </>
      )}
    </div>
  );
}
