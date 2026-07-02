"use client";

import { useId, useState } from "react";
import type { DragEvent } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { extractErrorMessage } from "@/lib/axios";

/** A single-image drag/drop uploader that stores the resulting Cloudinary URL. */
export function ImageUploadField({
  value,
  onChange,
  folder = "stock-inventory/products",
  compact = false,
}: {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  compact?: boolean;
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadToCloudinary(file, "image", folder);
      onChange(res.secureUrl);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(extractErrorMessage(e, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (!uploading) pick(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex ${
          compact ? "h-16" : "h-24"
        } cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-muted/30 text-center text-[10px] text-muted-foreground transition hover:bg-muted/50 ${
          dragging ? "border-primary bg-primary/10 text-primary" : ""
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className={`${compact ? "h-4 w-4" : "h-5 w-5"} animate-spin`} />
            <span>Uploading…</span>
          </>
        ) : value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" className={`${compact ? "h-9 w-9" : "h-14 w-14"} rounded object-cover`} />
            <span className="text-primary underline">Replace</span>
          </>
        ) : (
          <>
            <Upload className={compact ? "h-4 w-4" : "h-5 w-5"} />
            <span>{compact ? "Add" : dragging ? "Drop image here" : "Click or drag a file here"}</span>
          </>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </label>
      {value && !uploading && !compact && (
        <Button type="button" size="sm" variant="outline" onClick={() => onChange("")}>
          <X className="mr-1 h-3.5 w-3.5" /> Remove
        </Button>
      )}
    </div>
  );
}
