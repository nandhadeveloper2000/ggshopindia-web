"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  src?: string | null;
  alt?: string;
  className?: string;
  /** Show the full (uncropped) image in a floating preview while hovering. */
  zoom?: boolean;
}

export function ImagePreview({ src, alt = "", className, zoom }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  if (!src) {
    return (
      <div className={cn("flex items-center justify-center rounded-md bg-muted text-muted-foreground", className)}>
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }

  if (!zoom) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={cn("h-full w-full rounded-md object-cover", className)} />;
  }

  // Floating full-image preview near the cursor, portalled to <body> so it is
  // never clipped by a card's overflow. Clamped to stay on screen.
  const preview =
    pos && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[9999]"
            style={{
              left: Math.max(12, Math.min(pos.x + 20, window.innerWidth - 432)),
              top: Math.max(12, Math.min(pos.y + 20, window.innerHeight - 432)),
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-h-[420px] max-w-[420px] rounded-lg border bg-white object-contain shadow-2xl"
            />
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn("h-full w-full cursor-zoom-in rounded-md object-cover", className)}
        onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setPos(null)}
      />
      {preview}
    </>
  );
}
