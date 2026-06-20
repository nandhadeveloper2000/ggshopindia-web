"use client";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantityInput({ value, onChange, min = 1, max = 999, className }: Props) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className={"flex h-9 items-center rounded-md border " + (className ?? "")}>
      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={dec} disabled={value <= min}>
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Input
        type="number"
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
        }}
        className="h-9 w-14 border-0 text-center focus-visible:ring-0"
      />
      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={inc} disabled={value >= max}>
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
