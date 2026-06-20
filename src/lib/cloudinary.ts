/**
 * Frontend uploader. Sends the file to our own backend, which uploads to
 * Cloudinary using the server-side API secret and returns the resulting URL.
 * The Cloudinary API secret never reaches the browser.
 */

import { apiClient } from "@/lib/axios";

export type CloudinaryResource = "image" | "document";

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  format?: string;
}

interface BackendUploadResponse {
  url: string;
  secureUrl: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  format?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export function isCloudinaryConfigured(): boolean {
  // Backend owns the config now — assume true; backend will return a clean
  // error if its env vars are missing.
  return true;
}

export async function uploadToCloudinary(
  file: File,
  resourceType: CloudinaryResource = "image",
  folder?: string
): Promise<CloudinaryUploadResult> {
  const form = new FormData();
  form.append("file", file);
  if (folder) form.append("folder", folder);

  const endpoint = resourceType === "document" ? "/uploads/document" : "/uploads/image";
  const res = await apiClient.post<ApiEnvelope<BackendUploadResponse>>(endpoint, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const data = res.data?.data;
  if (!data?.secureUrl) {
    throw new Error(res.data?.message ?? "Upload failed");
  }
  return data;
}
