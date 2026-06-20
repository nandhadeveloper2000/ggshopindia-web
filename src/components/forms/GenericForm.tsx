"use client";

import { ReactNode, useState } from "react";
import { useForm, FieldValues, DefaultValues, Path, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodSchema } from "zod";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { extractErrorMessage } from "@/lib/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "textarea"
  | "select"
  | "switch"
  | "date"
  | "password"
  | "image";

export interface FormField<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  description?: string;
  colSpan?: 1 | 2;
  maxLength?: number;
  /** Cloudinary folder (only used by `image` field type). */
  uploadFolder?: string;
}

interface Props<T extends FieldValues> {
  schema: ZodSchema<T>;
  fields: FormField<T>[];
  defaultValues: DefaultValues<T>;
  onSubmit: (values: T) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function GenericForm<T extends FieldValues>({
  schema,
  fields,
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: Props<T>) {
  const form = useForm<T>({ resolver: zodResolver(schema), defaultValues });

  const handle = async (values: T) => {
    try {
      await onSubmit(values);
      toast.success("Saved successfully");
      onCancel?.();
    } catch {
      toast.error("Could not save");
    }
  };

  const errors = form.formState.errors as FieldErrors<T>;

  return (
    <form onSubmit={form.handleSubmit(handle)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const error = errors[f.name as keyof typeof errors] as { message?: string } | undefined;
          const span = f.colSpan === 2 ? "sm:col-span-2" : "";

          if (f.type === "textarea") {
            return (
              <div key={String(f.name)} className={`space-y-1.5 ${span}`}>
                <Label htmlFor={String(f.name)}>{f.label}</Label>
                <Textarea id={String(f.name)} placeholder={f.placeholder} {...form.register(f.name)} />
                {error?.message && <p className="text-xs text-destructive">{String(error.message)}</p>}
              </div>
            );
          }

          if (f.type === "select") {
            const current = (form.watch(f.name) ?? "") as string;
            return (
              <div key={String(f.name)} className={`space-y-1.5 ${span}`}>
                <Label>{f.label}</Label>
                <Select
                  value={String(current)}
                  onValueChange={(v) => form.setValue(f.name, v as T[typeof f.name])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={f.placeholder ?? `Select ${f.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => (
                      <SelectItem key={String(o.value)} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error?.message && <p className="text-xs text-destructive">{String(error.message)}</p>}
              </div>
            );
          }

          if (f.type === "switch") {
            const current = Boolean(form.watch(f.name));
            return (
              <div key={String(f.name)} className={`flex items-center gap-2 pt-6 ${span}`}>
                <Checkbox
                  id={String(f.name)}
                  checked={current}
                  onCheckedChange={(v) => form.setValue(f.name, Boolean(v) as T[typeof f.name])}
                />
                <Label htmlFor={String(f.name)}>{f.label}</Label>
              </div>
            );
          }

          if (f.type === "image") {
            const value = (form.watch(f.name) ?? "") as string;
            return (
              <div key={String(f.name)} className={`space-y-1.5 ${span}`}>
                <Label>{f.label}</Label>
                <ImageField
                  value={value}
                  folder={f.uploadFolder}
                  onChange={(url) =>
                    form.setValue(f.name, url as T[typeof f.name], {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
                {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
                {error?.message && <p className="text-xs text-destructive">{String(error.message)}</p>}
              </div>
            );
          }

          return (
            <div key={String(f.name)} className={`space-y-1.5 ${span}`}>
              <Label htmlFor={String(f.name)}>{f.label}</Label>
              <Input
                id={String(f.name)}
                type={f.type ?? "text"}
                placeholder={f.placeholder}
                maxLength={f.maxLength}
                {...form.register(f.name, f.type === "number" ? { valueAsNumber: true } : {})}
              />
              {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
              {error?.message && <p className="text-xs text-destructive">{String(error.message)}</p>}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function ImageField({
  value,
  folder,
  onChange,
}: {
  value: string;
  folder?: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputId = `img-${Math.random().toString(36).slice(2, 8)}`;

  const handlePick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    setFileName(file.name);
    setUploading(true);
    try {
      const res = await uploadToCloudinary(file, "image", folder);
      onChange(res.secureUrl);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(extractErrorMessage(e, "Upload failed"));
      setFileName("");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (uploading) return;
    handlePick(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-muted/30 text-center text-xs text-muted-foreground transition hover:bg-muted/50 ${
          dragging ? "border-primary bg-primary/10 text-primary" : ""
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Uploading {fileName}…</span>
          </>
        ) : value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              className="h-16 w-16 rounded-md object-cover"
            />
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
              onClick={(e) => e.stopPropagation()}
            >
              View image
            </a>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5" />
            <span>{dragging ? "Drop image here" : "Click or drag a file here"}</span>
          </>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => handlePick(e.target.files?.[0])}
        />
      </label>
      <div className="flex gap-2">
        <Button
          type="button"
          className="flex-1"
          disabled={uploading}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…
            </>
          ) : value ? (
            "Replace Image"
          ) : (
            "Upload Image"
          )}
        </Button>
        {value && !uploading && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onChange("");
              setFileName("");
            }}
          >
            <X className="mr-1 h-4 w-4" /> Remove
          </Button>
        )}
      </div>
    </div>
  );
}
