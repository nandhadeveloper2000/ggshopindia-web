"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FilterState {
  categories?: string[];
  brands?: string[];
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
}

interface Props {
  categories: { id: string | number; name: string }[];
  brands: { id: string | number; name: string }[];
  value: FilterState;
  onChange: (v: FilterState) => void;
}

export function ProductFilterSidebar({ categories, brands, value, onChange }: Props) {
  const toggle = (key: "categories" | "brands", val: string) => {
    const set = new Set(value[key] ?? []);
    if (set.has(val)) set.delete(val);
    else set.add(val);
    onChange({ ...value, [key]: Array.from(set) });
  };

  return (
    <Card>
      <CardContent className="space-y-5 p-4">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Categories</h3>
          <div className="space-y-1.5">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={(value.categories ?? []).includes(c.name)}
                  onCheckedChange={() => toggle("categories", c.name)}
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Brands</h3>
          <div className="space-y-1.5">
            {brands.map((b) => (
              <label key={b.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={(value.brands ?? []).includes(b.name)} onCheckedChange={() => toggle("brands", b.name)} />
                {b.name}
              </label>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Price Range</h3>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={value.priceMin ?? ""}
              onChange={(e) => onChange({ ...value, priceMin: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Input
              type="number"
              placeholder="Max"
              value={value.priceMax ?? ""}
              onChange={(e) => onChange({ ...value, priceMax: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={value.inStock ?? false} onCheckedChange={(v) => onChange({ ...value, inStock: Boolean(v) })} />
            In stock only
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

export type { FilterState };
