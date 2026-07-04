"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Store } from "lucide-react";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface Category {
  id: string | number;
  name: string;
  imageUrl?: string | null;
}

/**
 * Flipkart-style top category bar: a full-width, swipeable row of category
 * icon + label items with left/right scroll arrows at the edges. The items
 * spread edge-to-edge; the arrows grey out when there is nothing to scroll.
 */
export function CategoryStrip({ categories }: { categories: Category[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    // Vertical mouse-wheel scrolls the row sideways.
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
      el.removeEventListener("wheel", onWheel);
    };
  }, [update, categories.length]);

  if (!categories.length) return null;

  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  const arrow =
    "absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-foreground shadow-md transition hover:text-primary disabled:cursor-default disabled:opacity-30 disabled:hover:text-foreground sm:flex";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll(-1)}
        disabled={!canLeft}
        aria-label="Scroll categories left"
        className={cn(arrow, "left-1")}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div
        ref={scrollRef}
        className="flex items-center gap-8 overflow-x-auto px-2 py-2.5 [scrollbar-width:none] sm:justify-between sm:px-12 [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={routes.customer.category(cat.id, cat.name)}
            className="group flex shrink-0 items-center gap-2"
          >
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-border transition group-hover:ring-2 group-hover:ring-primary">
              {cat.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover" />
              ) : (
                <Store className="h-5 w-5 text-primary" />
              )}
            </span>
            <span className="whitespace-nowrap text-sm font-medium text-foreground group-hover:text-primary">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scroll(1)}
        disabled={!canRight}
        aria-label="Scroll categories right"
        className={cn(arrow, "right-1")}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
