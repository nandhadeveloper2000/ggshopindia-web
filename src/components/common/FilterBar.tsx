"use client";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function FilterBar({ children }: Props) {
  return <div className="flex flex-col gap-2 md:flex-row md:items-center md:flex-wrap">{children}</div>;
}
