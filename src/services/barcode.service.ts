import { apiRequest } from "./_helpers";
import type { ID } from "@/types/common.types";

export interface BarcodeRequest {
  productId: ID;
  batch?: string;
  type: "BARCODE" | "QR";
  labelWidth?: number;
  labelHeight?: number;
  printCount: number;
}

export const barcodeService = {
  generate: (payload: BarcodeRequest) => apiRequest<{ data: string }>({ method: "POST", url: "/barcode/generate", data: payload }),
};
