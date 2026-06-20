"use client";
import { useState } from "react";

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const upload = async (file: File): Promise<string> => {
    setUploading(true);
    try {
      // Placeholder: integrate with backend upload endpoint
      await new Promise((res) => setTimeout(res, 600));
      return URL.createObjectURL(file);
    } finally {
      setUploading(false);
    }
  };
  return { uploading, upload };
}
