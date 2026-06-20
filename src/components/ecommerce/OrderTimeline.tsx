"use client";

import { CheckCircle2, Circle } from "lucide-react";
import type { OrderStatus } from "@/types/order.types";
import { cn } from "@/lib/utils";

const STEPS: OrderStatus[] = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];

interface Props {
  status: OrderStatus;
}

export function OrderTimeline({ status }: Props) {
  const currentIdx = STEPS.indexOf(status);

  return (
    <div className="flex items-center justify-between gap-2">
      {STEPS.map((s, i) => {
        const done = i <= currentIdx && status !== "CANCELLED" && status !== "RETURNED";
        const Icon = done ? CheckCircle2 : Circle;
        return (
          <div key={s} className="flex flex-1 flex-col items-center text-center">
            <Icon className={cn("h-6 w-6", done ? "text-success" : "text-muted-foreground")} />
            <span className={cn("mt-1 text-xs", done ? "font-medium" : "text-muted-foreground")}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
