"use client";
import { useState } from "react";

export function useTableFilters<T extends Record<string, unknown> = Record<string, unknown>>(initial: T) {
  const [filters, setFilters] = useState<T>(initial);
  const updateFilter = <K extends keyof T>(key: K, value: T[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  const reset = () => setFilters(initial);
  return { filters, setFilters, updateFilter, reset };
}
