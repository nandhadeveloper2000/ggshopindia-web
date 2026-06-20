"use client";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  src?: string | null;
  alt?: string;
  className?: string;
}

export function ImagePreview({ src, alt = "", className }: Props) {
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center rounded-md bg-muted text-muted-foreground", className)}>
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={cn("h-full w-full object-cover rounded-md", className)} />;
}
