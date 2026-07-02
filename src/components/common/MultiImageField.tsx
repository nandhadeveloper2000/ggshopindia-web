"use client";

import { X } from "lucide-react";
import { ImageUploadField } from "./ImageUploadField";

/**
 * A grid of image upload boxes. The first image is the thumbnail; the rest are
 * additional images. A trailing empty box lets you add more (up to `max`).
 */
export function MultiImageField({
  value = [],
  onChange,
  max = 12,
  folder,
}: {
  value?: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  folder?: string;
}) {
  const images = value;
  const replaceAt = (i: number, url: string) => {
    if (!url) return;
    const next = [...images];
    next[i] = url;
    onChange(next);
  };
  const removeAt = (i: number) => onChange(images.filter((_, idx) => idx !== i));
  const add = (url: string) => {
    if (url) onChange([...images, url]);
  };
  const canAdd = images.length < max;

  return (
    <div className="grid w-60 grid-cols-3 gap-1.5">
      {images.map((url, i) => (
        <div key={i} className="relative">
          {i === 0 && (
            <span className="absolute left-1 top-1 z-10 rounded bg-primary px-1 text-[8px] font-medium text-primary-foreground">
              Thumb
            </span>
          )}
          <button
            type="button"
            onClick={() => removeAt(i)}
            aria-label="Remove image"
            className="absolute right-1 top-1 z-10 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
          >
            <X className="h-3 w-3" />
          </button>
          <ImageUploadField value={url} onChange={(u) => replaceAt(i, u)} folder={folder} compact />
        </div>
      ))}
      {canAdd && <ImageUploadField value="" onChange={add} folder={folder} compact />}
    </div>
  );
}
