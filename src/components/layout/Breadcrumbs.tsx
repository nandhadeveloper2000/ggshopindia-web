"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center text-xs text-muted-foreground" aria-label="Breadcrumb">
      {parts.map((part, idx) => {
        const href = "/" + parts.slice(0, idx + 1).join("/");
        const label = part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const last = idx === parts.length - 1;
        return (
          <span key={href} className="flex items-center gap-1">
            {idx > 0 && <ChevronRight className="h-3 w-3" />}
            {last ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
