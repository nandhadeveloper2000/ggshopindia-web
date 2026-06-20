"use client";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  trend?: number;
  iconClassName?: string;
}

export function StatCard({ title, value, icon: Icon, hint, trend, iconClassName }: Props) {
  const trendPositive = (trend ?? 0) >= 0;
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
            {typeof trend === "number" && (
              <span
                className={cn(
                  "mt-2 inline-flex items-center text-xs font-medium",
                  trendPositive ? "text-success" : "text-destructive"
                )}
              >
                {trendPositive ? "▲" : "▼"} {Math.abs(trend)}%
              </span>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary",
                iconClassName
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
