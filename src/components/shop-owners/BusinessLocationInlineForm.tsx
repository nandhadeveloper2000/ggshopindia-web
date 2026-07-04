"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, LocateFixed, MapPin, Plus, Upload, X } from "lucide-react";
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
import { reverseOsm, type OsmAddressFill } from "@/lib/osm";
import { shopsService } from "@/services/shops.service";
import type {
  BillingType,
  BusinessType,
  Shop,
  ShopType,
} from "@/types/shop.types";
import {
  LiveLocationMap,
  ShopNameOsmSearch,
  WORKING_DAYS_OPTIONS,
  toCoord,
} from "./location-fields";

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
  addressLine: string;
  pincode: string;
  /** Stored as strings while editing; parsed to numbers on save. */
  latitude: string;
  longitude: string;
  deliveryAvailable: boolean;
  workingDays: string;
  openingTime: string;
  closingTime: string;
  frontImageUrl: string;
  bannerImageUrl: string;
  gstCertificateUrl: string;
  udyamCertificateUrl: string;
  password: string;
  pin: string;
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
  addressLine: "",
  pincode: "",
  latitude: "",
  longitude: "",
  deliveryAvailable: false,
  workingDays: "Monday – Saturday",
  openingTime: "",
  closingTime: "",
  frontImageUrl: "",
  bannerImageUrl: "",
  gstCertificateUrl: "",
  udyamCertificateUrl: "",
  password: "",
  pin: "",
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
    state: s.address?.state ?? s.state ?? "",
    district: s.address?.district ?? s.district ?? "",
    taluk: s.address?.taluk ?? s.taluk ?? "",
    area: s.address?.area ?? s.area ?? "",
    street: s.address?.street ?? s.settings?.street ?? "",
    addressLine: s.address?.addressLine ?? "",
    pincode: s.address?.pincode ?? s.pincode ?? "",
    latitude: s.latitude != null ? String(s.latitude) : "",
    longitude: s.longitude != null ? String(s.longitude) : "",
    deliveryAvailable: s.deliveryAvailable ?? false,
    workingDays: s.workingDays ?? "",
    openingTime: s.openingTime ?? "",
    closingTime: s.closingTime ?? "",
    frontImageUrl: s.frontImageUrl ?? docs.frontImageUrl ?? "",
    bannerImageUrl: s.bannerImageUrl ?? "",
    gstCertificateUrl: docs.gstCertificateUrl ?? "",
    udyamCertificateUrl: docs.udyamCertificateUrl ?? "",
    // Credentials never come back from the API — blank on edit means "keep".
    password: "",
    pin: "",
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
  const [locating, setLocating] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showPin, setShowPin] = useState(false);

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

  // Merge an OpenStreetMap result (search pick or reverse geocode) into the
  // draft, only overwriting fields the result actually resolved.
  const applyOsmFill = (fill: OsmAddressFill) =>
    setDraft((d) => ({
      ...d,
      street: fill.street ?? d.street,
      area: fill.area ?? d.area,
      taluk: fill.taluk ?? d.taluk,
      district: fill.district ?? d.district,
      state: fill.state ?? d.state,
      pincode: fill.pincode ?? d.pincode,
      latitude: fill.latitude ?? d.latitude,
      longitude: fill.longitude ?? d.longitude,
    }));

  const clearAddress = () =>
    setDraft((d) => ({
      ...d,
      state: "",
      district: "",
      taluk: "",
      area: "",
      street: "",
      addressLine: "",
      pincode: "",
      latitude: "",
      longitude: "",
    }));

  const getCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }
    // Browsers block geolocation on insecure (HTTP) origins.
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      toast.error(
        "Get Current Location needs a secure (HTTPS) site. This link is HTTP — " +
          "enter Latitude/Longitude manually or use the shop-name OpenStreetMap search."
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const fill = await reverseOsm(latitude, longitude);
          applyOsmFill({ ...fill, latitude: String(latitude), longitude: String(longitude) });
          toast.success("Location detected");
        } catch (e) {
          toast.error(extractErrorMessage(e, "Could not resolve address from location"));
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow location for this site in your browser, or enter Latitude/Longitude manually."
            : err.message || "Could not get current location";
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // OSM has poor coverage of small businesses. Let the user look the shop up on
  // Google Maps (works over HTTP), then read off / paste coordinates.
  const openGoogleMaps = () => {
    const q =
      draft.shopName.trim() ||
      [draft.area, draft.district, draft.state].filter(Boolean).join(" ");
    if (!q) {
      toast.error("Enter a shop name or address first");
      return;
    }
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

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
    if (draft.password && draft.password.length < 6)
      return "Location login password must be at least 6 characters";
    if (draft.pin && !draft.pin.match(/^\d{4,6}$/))
      return "Location login PIN must be 4-6 digits";
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
        // Draft keeps lat/lng as free-text; the API expects numbers (or none).
        latitude: toCoord(draft.latitude),
        longitude: toCoord(draft.longitude),
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
          <ShopNameOsmSearch
            value={draft.shopName}
            onValueChange={(v) => update("shopName", v)}
            onPick={applyOsmFill}
          />
          <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
            Type 3+ characters to search OpenStreetMap. Picking a result
            auto-fills street/area/district/state/pincode + lat/lng.
          </p>
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
            placeholder="Mobile (also this location's login ID)"
            maxLength={10}
          />
        </FieldLabel>
        <FieldLabel label={shop ? "Login Password (new)" : "Login Password"}>
          <div className="relative">
            <Input
              type={showPwd ? "text" : "password"}
              value={draft.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder={shop ? "Leave blank to keep" : "Min 6 chars (optional)"}
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPwd ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FieldLabel>
        <FieldLabel label="Login PIN">
          <div className="relative">
            <Input
              type={showPin ? "text" : "password"}
              value={draft.pin}
              onChange={(e) => update("pin", e.target.value)}
              placeholder={shop ? "Leave blank to keep" : "4-6 digits (optional)"}
              maxLength={6}
              inputMode="numeric"
              autoComplete="off"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPin((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPin ? "Hide PIN" : "Show PIN"}
              tabIndex={-1}
            >
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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
        <FieldLabel label="Address Line">
          <Input
            value={draft.addressLine}
            onChange={(e) => update("addressLine", e.target.value)}
            placeholder="Building / landmark"
          />
        </FieldLabel>
        <FieldLabel label="Latitude">
          <Input
            value={draft.latitude}
            onChange={(e) => update("latitude", e.target.value)}
            placeholder="e.g. 13.0776"
            inputMode="decimal"
          />
        </FieldLabel>
        <FieldLabel label="Longitude">
          <Input
            value={draft.longitude}
            onChange={(e) => update("longitude", e.target.value)}
            placeholder="e.g. 80.2917"
            inputMode="decimal"
          />
        </FieldLabel>
        <FieldLabel label="Delivery" required>
          <Select
            value={draft.deliveryAvailable ? "true" : "false"}
            onValueChange={(v) => update("deliveryAvailable", v === "true")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Available</SelectItem>
              <SelectItem value="false">Not Available</SelectItem>
            </SelectContent>
          </Select>
        </FieldLabel>
        <FieldLabel label="Working Days">
          <Select
            value={draft.workingDays || undefined}
            onValueChange={(v) => update("workingDays", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select working days" />
            </SelectTrigger>
            <SelectContent>
              {WORKING_DAYS_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldLabel>
        <FieldLabel label="Opening Time">
          <Input
            value={draft.openingTime}
            onChange={(e) => update("openingTime", e.target.value)}
            placeholder="08:00 AM"
          />
        </FieldLabel>
        <FieldLabel label="Closing Time">
          <Input
            value={draft.closingTime}
            onChange={(e) => update("closingTime", e.target.value)}
            placeholder="07:00 PM"
          />
        </FieldLabel>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] leading-tight text-muted-foreground">
          Latitude / Longitude help customers locate this shop. Use
          <span className="font-medium"> Get Current Location</span> to auto-fill
          from your device.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={clearAddress}>
            <X className="mr-1.5 h-3.5 w-3.5" /> Clear Address
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={openGoogleMaps}>
            <MapPin className="mr-1.5 h-3.5 w-3.5" /> Find on Google Maps
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={getCurrentLocation}
            disabled={locating}
          >
            {locating ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <LocateFixed className="mr-1.5 h-3.5 w-3.5" />
            )}
            Get Current Location
          </Button>
        </div>
      </div>

      <LiveLocationMap lat={draft.latitude} lon={draft.longitude} />

      <div className="mt-6 rounded-lg border p-4">
        <h4 className="mb-1 text-sm font-semibold">Location Proof Documents</h4>
        <p className="mb-4 text-xs text-muted-foreground">
          Add the shop front image and business proof documents for this
          location.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            label="Shop Banner / Visiting Card"
            hint="Banner board or visiting card"
            accept="image/*"
            resource="image"
            folder="shops/banners"
            value={draft.bannerImageUrl}
            onChange={(url) => update("bannerImageUrl", url)}
            cta="Upload Banner"
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
