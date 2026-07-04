"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ImageOff, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * E-commerce product gallery (Flipkart / Amazon desktop style):
 *  - vertical thumbnail rail on the LEFT with up/down scroll chevrons
 *    (becomes a horizontal strip below the image on mobile)
 *  - large main image on the RIGHT with prev/next arrows
 *  - hover to ZOOM into the region under the cursor
 *  - AUTO-SCROLLS through the images, pausing while the pointer is over it
 */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const stripRef = useRef<HTMLDivElement | null>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const count = images.length;
  const safeActive = count ? Math.min(active, count - 1) : 0;

  // Auto-advance; pause on hover so it never fights the user.
  useEffect(() => {
    if (paused || count < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % count), 3500);
    return () => clearInterval(t);
  }, [paused, count]);

  // Keep the active thumbnail in view as autoplay / arrows move it.
  useEffect(() => {
    thumbRefs.current[safeActive]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [safeActive]);

  if (!count) {
    return (
      <div className="flex h-[340px] items-center justify-center rounded-md bg-muted text-muted-foreground sm:h-[440px] lg:h-[480px]">
        <ImageOff className="h-8 w-8" />
      </div>
    );
  }

  const go = (dir: number) => setActive((a) => (a + dir + count) % count);

  const scrollStrip = (dir: number) => {
    const el = stripRef.current;
    if (!el) return;
    const vertical = typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches;
    if (vertical) el.scrollBy({ top: dir * 200, behavior: "smooth" });
    else el.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  const arrowBtn =
    "flex h-9 w-9 items-center justify-center rounded-full border bg-white/90 text-foreground shadow-sm transition hover:bg-white hover:text-primary disabled:opacity-40";

  return (
    <div
      className="flex flex-col-reverse gap-3 sm:flex-row"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setZooming(false);
      }}
    >
      {/* ── Thumbnail rail (left on desktop, below on mobile) ─────────── */}
      {count > 1 && (
        <div className="flex items-center gap-1 sm:w-[68px] sm:flex-col">
          <button
            type="button"
            onClick={() => scrollStrip(-1)}
            aria-label="Scroll thumbnails up"
            className={cn(arrowBtn, "hidden h-7 w-7 sm:flex")}
          >
            <ChevronUp className="h-4 w-4" />
          </button>

          <div
            ref={stripRef}
            className="flex gap-2 overflow-auto [scrollbar-width:none] sm:max-h-[400px] sm:flex-col [&::-webkit-scrollbar]:hidden"
          >
            {images.map((img, i) => (
              <button
                key={i}
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                type="button"
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={i === safeActive}
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white p-1 transition",
                  i === safeActive ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/60",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="h-full w-full object-contain" />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollStrip(1)}
            aria-label="Scroll thumbnails down"
            className={cn(arrowBtn, "hidden h-7 w-7 sm:flex")}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Main image (right) with prev/next arrows ─────────────────── */}
      <div className="relative flex-1">
        <div
          className="group relative flex h-[340px] cursor-zoom-in items-center justify-center overflow-hidden rounded-md bg-white sm:h-[440px] lg:h-[480px]"
          onMouseEnter={() => setZooming(true)}
          onMouseLeave={() => setZooming(false)}
          onMouseMove={onMove}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[safeActive]}
            alt={alt}
            className="h-full w-full object-contain transition-transform duration-200 ease-out"
            style={{ transform: zooming ? "scale(2.2)" : "scale(1)", transformOrigin: origin }}
          />
          <span className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100">
            <ZoomIn className="h-3 w-3" /> Hover to zoom
          </span>
        </div>

        {count > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button type="button" onClick={() => go(-1)} aria-label="Previous image" className={arrowBtn}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next image" className={arrowBtn}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
