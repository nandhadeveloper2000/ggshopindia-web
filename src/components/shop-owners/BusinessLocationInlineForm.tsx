"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDIAN_STATES } from "@/lib/constants";
import { uploadToCloudinary, type CloudinaryResource } from "@/lib/cloudinary";
import { extractErrorMessage } from "@/lib/axios";
import { shopsService } from "@/services/shops.service";
import type {
  BillingType,
  BusinessType,
  Shop,
  ShopType,
} from "@/types/shop.types";

const SHOP_TYPE_OPTIONS: { value: ShopType; label: string }[] = [
  { value: "MAIN", label: "Main" },
  { value: "BRANCH", label: "Branch" },
];

const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: "RETAIL", label: "Retail" },
  { value: "WHOLESALE", label: "Wholesale" },
  { value: "RETAIL_WHOLESALE", label: "Retail + Wholesale" },
];

const BILLING_TYPE_OPTIONS: { value: BillingType; label: string }[] = [
  { value: "GST", label: "GST" },
  { value: "NON_GST", label: "Non-GST" },
  { value: "BOTH", label: "Both" },
];

interface LocationDraft {
  shopName: string;
  shopType: ShopType;
  parentShopId: string;
  businessType: BusinessType;
  billingType: BillingType;
  contactMobile: string;
  gstNumber: string;
  state: string;
  district: string;
  taluk: string;
  area: string;
  street: string;
  pincode: string;
  frontImageUrl: string;
  gstCertificateUrl: string;
  udyamCertificateUrl: string;
}

const emptyDraft: LocationDraft = {
  shopName: "",
  shopType: "MAIN",
  parentShopId: "",
  businessType: "RETAIL",
  billingType: "GST",
  contactMobile: "",
  gstNumber: "",
  state: "",
  district: "",
  taluk: "",
  area: "",
  street: "",
  pincode: "",
  frontImageUrl: "",
  gstCertificateUrl: "",
  udyamCertificateUrl: "",
};

function fromShop(shop: Shop): LocationDraft {
  type Documents = {
    frontImageUrl?: string;
    gstCertificateUrl?: string;
    udyamCertificateUrl?: string;
  };
  type ShopWithExtras = Shop & {
    name?: string;
    mobile?: string;
    settings?: {
      businessType?: BusinessType;
      billingType?: BillingType;
      street?: string;
      documents?: Documents;
    };
  };
  const s = shop as ShopWithExtras;
  const docs = s.settings?.documents ?? {};
  const parentShopId = (s as { parentShopId?: string }).parentShopId ?? "";
  return {
    shopName: s.shopName ?? s.name ?? "",
    shopType: s.shopType ?? "MAIN",
    parentShopId,
    businessType: s.settings?.businessType ?? s.businessType ?? "RETAIL",
    billingType: s.settings?.billingType ?? s.billingType ?? "GST",
    contactMobile: s.contactMobile ?? s.mobile ?? "",
    gstNumber: s.gstin ?? "",
    state: s.state ?? "",
    district: s.district ?? "",
    taluk: s.taluk ?? "",
    area: s.area ?? "",
    street: s.settings?.street ?? "",
    pincode: s.pincode ?? "",
    frontImageUrl: docs.frontImageUrl ?? "",
    gstCertificateUrl: docs.gstCertificateUrl ?? "",
    udyamCertificateUrl: docs.udyamCertificateUrl ?? "",
  };
}

export interface BusinessLocationInlineFormProps {
  ownerId: string;
  /** When provided, the form runs in edit mode and PUTs to the existing shop. */
  shop?: Shop;
  /** Existing shops for this owner — used to populate the parent dropdown when BRANCH. */
  ownerShops?: Shop[];
  onSaved: () => void;
  onCancel: () => void;
}

export function BusinessLocationInlineForm({
  ownerId,
  shop,
  ownerShops = [],
  onSaved,
  onCancel,
}: BusinessLocationInlineFormProps) {
  const [draft, setDraft] = useState<LocationDraft>(
    shop ? fromShop(shop) : emptyDraft
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(shop ? fromShop(shop) : emptyDraft);
  }, [shop]);

  // Eligible parents = existing MAIN shops for this owner (exclude self in edit mode).
  const mainShops = ownerShops.filter(
    (s) => s.shopType === "MAIN" && (!shop || s.id !== shop.id)
  );
  const hasMain = mainShops.length > 0;

  const update = <K extends keyof LocationDraft>(k: K, v: LocationDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const gstRequired =
    draft.billingType === "GST" || draft.billingType === "BOTH";

  const validate = (): string | null => {
    if (!draft.shopName.trim()) return "Shop / Location name is required";
    if (!draft.contactMobile.trim()) return "Mobile is required";
    if (!draft.state.trim()) return "State is required";
    if (!draft.district.trim()) return "District is required";
    if (!draft.taluk.trim()) return "Taluk is required";
    if (!draft.area.trim()) return "Area is required";
    if (!draft.street.trim()) return "Street is required";
    if (!draft.pincode.trim()) return "Pincode is required";
    if (gstRequired) {
      if (!draft.gstNumber.trim()) return "GST number is required for GST billing";
      if (!draft.gstCertificateUrl.trim())
        return "GST certificate document is required for GST billing";
    }
    if (draft.shopType === "BRANCH" && !draft.parentShopId) {
      return "BRANCH must be linked to a parent MAIN shop";
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      // Strip GST fields when billing is Non-GST so the backend does not
      // validate an empty GSTIN format.
      const payload = {
        ...draft,
        gstNumber: gstRequired ? draft.gstNumber.trim() : "",
        gstCertificateUrl: gstRequired ? draft.gstCertificateUrl : "",
        parentShopId: draft.shopType === "BRANCH" ? draft.parentShopId : undefined,
        shopOwnerId: ownerId,
      };
      if (shop) {
        await shopsService.update(shop.id, payload);
        toast.success("Business location updated");
      } else {
        await shopsService.create(payload);
        toast.success("Business location added");
      }
      onSaved();
    } catch (e) {
      toast.error(extractErrorMessage(e, "Failed to save location"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {shop ? "Edit Business Location" : "New Business Location"}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FieldLabel label="Shop / Location Name" required>
          <Input
            value={draft.shopName}
            onChange={(e) => update("shopName", e.target.value)}
            placeholder="Shop name"
          />
        </FieldLabel>
        <FieldLabel label="Shop Type" required>
          <Select
            value={draft.shopType}
            onValueChange={(v) => {
              const next = v as ShopType;
              setDraft((d) => ({
                ...d,
                shopType: next,
                // Clear parent if switching back to MAIN.
                parentShopId: next === "MAIN" ? "" : d.parentShopId,
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {SHOP_TYPE_OPTIONS.map((o) => (
                <SelectItem
                  key={o.value}
                  value={o.value}
                  disabled={o.value === "BRANCH" && !hasMain}
                >
                  {o.label}
                  {o.value === "BRANCH" && !hasMain && " (need MAIN first)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldLabel>
        {draft.shopType === "BRANCH" && (
          <FieldLabel label="Parent Shop" required>
            <Select
              value={draft.parentShopId}
              onValueChange={(v) => update("parentShopId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent MAIN shop" />
              </SelectTrigger>
              <SelectContent>
                {mainShops.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.shopName ?? s.name ?? "Unnamed"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldLabel>
        )}
        <FieldLabel label="Business Type">
          <Select
            value={draft.businessType}
            onValueChange={(v) => update("businessType", v as BusinessType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldLabel>
        <FieldLabel label="Billing Type" required>
          <Select
            value={draft.billingType}
            onValueChange={(v) => update("billingType", v as BillingType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BILLING_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldLabel>
        <FieldLabel label="Mobile" required>
          <Input
            type="tel"
            value={draft.contactMobile}
            onChange={(e) => update("contactMobile", e.target.value)}
            placeholder="Mobile"
            maxLength={10}
          />
        </FieldLabel>
        <FieldLabel label="GST Number" required={gstRequired}>
          <Input
            value={draft.gstNumber}
            onChange={(e) => update("gstNumber", e.target.value)}
            placeholder={gstRequired ? "GST number" : "Not applicable"}
            disabled={!gstRequired}
          />
        </FieldLabel>
        <FieldLabel label="State" required>
          <Select value={draft.state} onValueChange={(v) => update("state", v)}>
            <SelectTrigger>
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {INDIAN_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldLabel>
        <FieldLabel label="District" required>
          <Input
            value={draft.district}
            onChange={(e) => update("district", e.target.value)}
            placeholder="District"
          />
        </FieldLabel>
        <FieldLabel label="Taluk" required>
          <Input
            value={draft.taluk}
            onChange={(e) => update("taluk", e.target.value)}
            placeholder="Taluk"
          />
        </FieldLabel>
        <FieldLabel label="Area" required>
          <Input
            value={draft.area}
            onChange={(e) => update("area", e.target.value)}
            placeholder="Area"
          />
        </FieldLabel>
        <FieldLabel label="Street" required>
          <Input
            value={draft.street}
            onChange={(e) => update("street", e.target.value)}
            placeholder="Street"
          />
        </FieldLabel>
        <FieldLabel label="Pincode" required>
          <Input
            value={draft.pincode}
            onChange={(e) => update("pincode", e.target.value)}
            placeholder="Pincode"
            maxLength={6}
          />
        </FieldLabel>
      </div>

      <div className="mt-6 rounded-lg border p-4">
        <h4 className="mb-1 text-sm font-semibold">Location Proof Documents</h4>
        <p className="mb-4 text-xs text-muted-foreground">
          Add the shop front image and business proof documents for this
          location.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <FilePickerBox
            label="Front Image"
            hint="Shop front photo"
            accept="image/*"
            resource="image"
            folder="shops/front-images"
            value={draft.frontImageUrl}
            onChange={(url) => update("frontImageUrl", url)}
            cta="Upload Front Image"
          />
          <FilePickerBox
            label="GST Certificate"
            hint={gstRequired ? "PDF or image (required)" : "Not applicable for Non-GST"}
            accept="image/*,application/pdf"
            resource="document"
            folder="shops/gst-certificates"
            value={draft.gstCertificateUrl}
            onChange={(url) => update("gstCertificateUrl", url)}
            cta="Upload GST Proof"
            disabled={!gstRequired}
          />
          <FilePickerBox
            label="Udyam Certificate"
            hint="PDF or image"
            accept="image/*,application/pdf"
            resource="document"
            folder="shops/udyam-certificates"
            value={draft.udyamCertificateUrl}
            onChange={(url) => update("udyamCertificateUrl", url)}
            cta="Upload Udyam Proof"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {shop ? "Save Changes" : "Save Location"}
        </Button>
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function FilePickerBox({
  label,
  hint,
  accept,
  resource,
  folder,
  value,
  onChange,
  cta,
  disabled,
}: {
  label: string;
  hint: string;
  accept: string;
  resource: CloudinaryResource;
  folder?: string;
  value: string;
  onChange: (url: string) => void;
  cta: string;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputId = `loc-file-${label.replace(/\s+/g, "-").toLowerCase()}`;

  const handlePick = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    try {
      const res = await uploadToCloudinary(file, resource, folder);
      onChange(res.secureUrl);
      toast.success(`${label} uploaded`);
    } catch (e) {
      toast.error(`${label}: ${extractErrorMessage(e, "Upload failed")}`);
      setFileName("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`space-y-2 ${disabled ? "opacity-50" : ""}`}>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <label
        htmlFor={inputId}
        className={`flex h-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-muted/30 text-center text-xs text-muted-foreground transition ${disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-muted/50"}`}
      >
        {uploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Uploading {fileName}…</span>
          </>
        ) : value ? (
          <>
            <span className="font-medium text-foreground">Uploaded</span>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
              onClick={(e) => e.stopPropagation()}
            >
              View file
            </a>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5" />
            <span>Click to select a file</span>
          </>
        )}
        <input
          id={inputId}
          type="file"
          accept={accept}
          className="hidden"
          disabled={uploading || disabled}
          onChange={(e) => handlePick(e.target.files?.[0])}
        />
      </label>
      <Button
        type="button"
        className="w-full"
        disabled={uploading || disabled}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…
          </>
        ) : value ? (
          "Replace"
        ) : (
          cta
        )}
      </Button>
    </div>
  );
}
