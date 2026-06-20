"use client";
import { ChangeEvent, useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  value?: string[];
  onChange?: (urls: string[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export function FileUpload({ value = [], onChange, accept = "image/*", multiple = true, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<string[]>(value);

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const next = [...urls, ...files.map((f) => URL.createObjectURL(f))];
    setUrls(next);
    onChange?.(next);
  };

  const remove = (idx: number) => {
    const next = urls.filter((_, i) => i !== idx);
    setUrls(next);
    onChange?.(next);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={handleFiles} className="hidden" />
      <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} className="gap-2">
        <UploadCloud className="h-4 w-4" /> Upload
      </Button>
      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {urls.map((u, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
