import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string, currency = "INR") {
  const num = typeof value === "string" ? Number(value) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(value: number | string) {
  const num = typeof value === "string" ? Number(value) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-IN").format(num);
}

export function formatDate(date: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", opts ?? { year: "numeric", month: "short", day: "2-digit" }).format(d);
}

export function formatDateTime(date: string | Date | null | undefined) {
  return formatDate(date, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function initials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
