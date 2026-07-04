"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Horizontal scroll container a regular mouse can drive by simply moving over it:
 *  - the pointer's position across the row maps to the scroll position
 *    (LEFT → start, CENTER → middle, RIGHT → end) and the content smoothly
 *    auto-scrolls to follow it
 *  - vertical mouse-wheel also scrolls it sideways
 * Clicks pass straight through to children. Native scrollbar is hidden; pass
 * flex/gap/padding via `className`.
 */
export function HScroll({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef<number | null>(null);
  const raf = useRef<number | null>(null);

  // Ease scrollLeft toward the target set by the mouse position.
  const tick = () => {
    const el = ref.current;
    if (!el || target.current == null) {
      raf.current = null;
      return;
    }
    const diff = target.current - el.scrollLeft;
    if (Math.abs(diff) < 0.5) {
      el.scrollLeft = target.current;
      raf.current = null;
      return;
    }
    el.scrollLeft += diff * 0.18;
    raf.current = requestAnimationFrame(tick);
  };
  const startLoop = () => {
    if (raf.current == null) raf.current = requestAnimationFrame(tick);
  };
  const stopLoop = () => {
    if (raf.current != null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
    target.current = null;
  };

  // Vertical wheel → horizontal scroll (native, non-passive so preventDefault works).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        target.current = el.scrollLeft; // keep in sync so hover doesn't fight the wheel
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      stopLoop();
    };
  }, []);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    target.current = ratio * (el.scrollWidth - el.clientWidth);
    startLoop();
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={stopLoop}
      className={cn(
        "flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
