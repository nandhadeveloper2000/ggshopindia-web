"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  LocateFixed,
  MapPin,
  Plus,
  Trash2,
  Upload,
  User as UserIcon,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shopOwnersService } from "@/services/shopOwners.service";
import { shopsService } from "@/services/shops.service";
import { INDIAN_STATES } from "@/lib/constants";
import { uploadToCloudinary, type CloudinaryResource } from "@/lib/cloudinary";
import { reverseOsm, type OsmAddressFill } from "@/lib/osm";
import { extractErrorMessage } from "@/lib/axios";
import {
  LiveLocationMap,
  ShopNameOsmSearch,
  WORKING_DAYS_OPTIONS,
  toCoord,
} from "./location-fields";
import type {
  BillingType,
  BusinessType,
  Shop,
  ShopOwner,
  ShopType,
} from "@/types/shop.types";

export const SHOP_CONTROL_OPTIONS = [
  { value: "INVENTORY_ONLY", label: "Inventory Only" },
  { value: "INVENTORY_AND_ECOMMERCE", label: "Inventory + Ecommerce Only" },
];

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

interface BusinessLocation {
  /** Set when editing an existing shop; absent for newly-added drafts. */
  __originalId?: string;
  shopName: string;
  shopType: ShopType;
  /** Required when shopType=BRANCH. Backend ID of the parent MAIN shop. */
  parentShopId?: string;
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
  isActive?: boolean;
  /** This location's own login credentials (mobile + password/PIN). */
  password: string;
  pin: string;
}

const emptyLocation: BusinessLocation = {
  shopName: "",
  shopType: "MAIN",
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

interface OwnerBasic {
  shopControl: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
  pin: string;
  primaryMobile: string;
  secondaryMobile: string;
}

interface OwnerAddress {
  state: string;
  district: string;
  taluk: string;
  area: string;
  street: string;
  pincode: string;
}

function genUsername(fullName: string): string {
  const base = fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base || "owner"}${suffix}`;
}

function shopToLocation(shop: Shop): BusinessLocation {
  return {
    __originalId: String(shop.id),
    shopName: shop.shopName ?? shop.name ?? "",
    shopType: shop.shopType ?? "MAIN",
    parentShopId: shop.parentShopId ? String(shop.parentShopId) : undefined,
    businessType: shop.businessType ?? "RETAIL",
    billingType: shop.billingType ?? "GST",
    contactMobile: shop.contactMobile ?? shop.mobile ?? "",
    gstNumber: shop.gstin ?? "",
    state: shop.address?.state ?? shop.state ?? "",
    district: shop.address?.district ?? shop.district ?? "",
    taluk: shop.address?.taluk ?? shop.taluk ?? "",
    area: shop.address?.area ?? shop.area ?? "",
    street: shop.address?.street ?? shop.settings?.street ?? "",
    addressLine: shop.address?.addressLine ?? "",
    pincode: shop.address?.pincode ?? shop.pincode ?? "",
    latitude: shop.latitude != null ? String(shop.latitude) : "",
    longitude: shop.longitude != null ? String(shop.longitude) : "",
    deliveryAvailable: shop.deliveryAvailable ?? false,
    workingDays: shop.workingDays ?? "",
    openingTime: shop.openingTime ?? "",
    closingTime: shop.closingTime ?? "",
    frontImageUrl: shop.frontImageUrl ?? shop.settings?.documents?.frontImageUrl ?? "",
    bannerImageUrl: shop.bannerImageUrl ?? "",
    gstCertificateUrl: shop.settings?.documents?.gstCertificateUrl ?? "",
    udyamCertificateUrl: shop.settings?.documents?.udyamCertificateUrl ?? "",
    isActive: shop.isActive,
    // Credentials are never returned by the API — leave blank on edit (keep existing).
    password: "",
    pin: "",
  };
}

export interface ShopOwnerFormProps {
  mode: "create" | "edit";
  ownerId?: string;
  initialOwner?: ShopOwner;
  initialShops?: Shop[];
}

export function ShopOwnerForm({ mode, ownerId, initialOwner, initialShops }: ShopOwnerFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showLocPassword, setShowLocPassword] = useState(false);
  const [showLocPin, setShowLocPin] = useState(false);

  const [basic, setBasic] = useState<OwnerBasic>(() => ({
    shopControl: initialOwner?.shopControl ?? "INVENTORY_ONLY",
    fullName: initialOwner?.name ?? "",
    username: initialOwner?.username ?? "",
    email: initialOwner?.email ?? "",
    password: "",
    pin: "",
    primaryMobile: initialOwner?.mobile ?? "",
    secondaryMobile: initialOwner?.secondaryMobile ?? "",
  }));
  const [address, setAddress] = useState<OwnerAddress>(() => ({
    state: initialOwner?.address?.state ?? "",
    district: initialOwner?.address?.district ?? "",
    taluk: initialOwner?.address?.taluk ?? "",
    area: initialOwner?.address?.area ?? "",
    street: initialOwner?.address?.street ?? "",
    pincode: initialOwner?.address?.pincode ?? "",
  }));
  const [avatarUrl, setAvatarUrl] = useState<string>(initialOwner?.profileImageUrl ?? "");
  const [idProofUrl, setIdProofUrl] = useState<string>(initialOwner?.idProofUrl ?? "");

  const [draftLocation, setDraftLocation] = useState<BusinessLocation>({ ...emptyLocation });
  const [locations, setLocations] = useState<BusinessLocation[]>(() =>
    (initialShops ?? []).map(shopToLocation)
  );
  // Snapshot of existing shop ids the form started with — used to detect deletions.
  const originalIds = useMemo(
    () => new Set((initialShops ?? []).map((s) => String(s.id))),
    [initialShops]
  );
  const [editingLocationIdx, setEditingLocationIdx] = useState<number | null>(null);

  // Re-sync when initial props change (edit page hydrates async).
  useEffect(() => {
    if (initialOwner) {
      setBasic((b) => ({
        ...b,
        shopControl: initialOwner.shopControl ?? b.shopControl,
        fullName: initialOwner.name ?? b.fullName,
        username: initialOwner.username ?? b.username,
        email: initialOwner.email ?? b.email,
        primaryMobile: initialOwner.mobile ?? b.primaryMobile,
        secondaryMobile: initialOwner.secondaryMobile ?? b.secondaryMobile,
      }));
      setAddress({
        state: initialOwner.address?.state ?? "",
        district: initialOwner.address?.district ?? "",
        taluk: initialOwner.address?.taluk ?? "",
        area: initialOwner.address?.area ?? "",
        street: initialOwner.address?.street ?? "",
        pincode: initialOwner.address?.pincode ?? "",
      });
      setAvatarUrl(initialOwner.profileImageUrl ?? "");
      setIdProofUrl(initialOwner.idProofUrl ?? "");
    }
  }, [initialOwner]);

  useEffect(() => {
    if (initialShops) setLocations(initialShops.map(shopToLocation));
  }, [initialShops]);

  const updateBasic = <K extends keyof OwnerBasic>(k: K, v: OwnerBasic[K]) =>
    setBasic((prev) => ({ ...prev, [k]: v }));
  const updateAddress = <K extends keyof OwnerAddress>(k: K, v: OwnerAddress[K]) =>
    setAddress((prev) => ({ ...prev, [k]: v }));
  const updateDraft = <K extends keyof BusinessLocation>(k: K, v: BusinessLocation[K]) =>
    setDraftLocation((prev) => ({ ...prev, [k]: v }));

  // Merge an OpenStreetMap result (search pick or reverse geocode) into the
  // draft, only overwriting fields the result actually resolved.
  const applyOsmFill = (fill: OsmAddressFill) =>
    setDraftLocation((d) => ({
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
    setDraftLocation((d) => ({
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
    // Browsers block geolocation on insecure (HTTP) origins. The S3 website
    // endpoint is HTTP-only, so guide the user instead of showing a raw error.
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

  // OpenStreetMap has poor coverage of small businesses. Let the user look the
  // shop up on Google Maps (works over HTTP), then read off / paste coordinates.
  const openGoogleMaps = () => {
    const q =
      draftLocation.shopName.trim() ||
      [draftLocation.area, draftLocation.district, draftLocation.state]
        .filter(Boolean)
        .join(" ");
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

  // BRANCH parent candidates: any MAIN shop in the saved list (use its backend
  // ID) or any MAIN currently drafted in the local list (use a "local:<idx>"
  // key that the save flow resolves once the backend ID is known).
  const parentOptions = useMemo(
    () =>
      locations
        .map((loc, idx) => ({ loc, idx }))
        .filter(({ loc, idx }) => {
          if (loc.shopType !== "MAIN") return false;
          // Don't allow picking the location being edited as its own parent.
          return editingLocationIdx === null || editingLocationIdx !== idx;
        })
        .map(({ loc, idx }) => ({
          value: loc.__originalId ?? `local:${idx}`,
          label: loc.shopName || `Location #${idx + 1}`,
        })),
    [locations, editingLocationIdx]
  );

  const addLocationToList = () => {
    if (!draftLocation.shopName.trim()) {
      toast.error("Shop / Location Name is required");
      return;
    }
    if (!draftLocation.contactMobile.match(/^[6-9]\d{9}$/)) {
      toast.error("Mobile must be a valid 10-digit Indian number");
      return;
    }
    if (draftLocation.password && draftLocation.password.length < 6) {
      toast.error("Location login password must be at least 6 characters");
      return;
    }
    if (draftLocation.pin && !draftLocation.pin.match(/^\d{4,6}$/)) {
      toast.error("Location login PIN must be 4-6 digits");
      return;
    }
    const gstRequired =
      draftLocation.billingType === "GST" || draftLocation.billingType === "BOTH";
    if (gstRequired) {
      if (!draftLocation.gstNumber.trim()) {
        toast.error("GST number is required for GST billing");
        return;
      }
      if (!draftLocation.gstCertificateUrl.trim()) {
        toast.error("GST certificate document is required for GST billing");
        return;
      }
    }
    if (draftLocation.shopType === "BRANCH" && !draftLocation.parentShopId) {
      toast.error("BRANCH must be linked to a parent MAIN shop");
      return;
    }
    // Strip GST fields when Non-GST so backend GSTIN validator does not fire.
    const normalized: BusinessLocation = {
      ...draftLocation,
      gstNumber: gstRequired ? draftLocation.gstNumber.trim() : "",
      gstCertificateUrl: gstRequired ? draftLocation.gstCertificateUrl : "",
      parentShopId:
        draftLocation.shopType === "BRANCH" ? draftLocation.parentShopId : undefined,
    };
    if (editingLocationIdx !== null) {
      setLocations((prev) =>
        prev.map((l, i) => (i === editingLocationIdx ? normalized : l))
      );
      setEditingLocationIdx(null);
      toast.success("Location updated");
    } else {
      setLocations((prev) => [...prev, normalized]);
      toast.success("Location added");
    }
    setDraftLocation({ ...emptyLocation });
  };

  const editLocation = (idx: number) => {
    setDraftLocation({ ...locations[idx] });
    setEditingLocationIdx(idx);
    // Scroll the draft into view.
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        document.getElementById("new-location-card")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  };

  const cancelLocationEdit = () => {
    setDraftLocation({ ...emptyLocation });
    setEditingLocationIdx(null);
  };

  const removeLocation = (idx: number) => {
    if (editingLocationIdx === idx) cancelLocationEdit();
    else if (editingLocationIdx !== null && idx < editingLocationIdx) {
      setEditingLocationIdx(editingLocationIdx - 1);
    }
    setLocations((prev) => prev.filter((_, i) => i !== idx));
  };

  const validateOwner = (): string | null => {
    if (!basic.fullName.trim()) return "Full Name is required";
    if (!basic.username.trim()) return "Username is required";
    if (basic.email && !basic.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return "Invalid email";
    if (!basic.primaryMobile.match(/^[6-9]\d{9}$/))
      return "Primary Mobile must be a valid 10-digit Indian number";
    if (basic.secondaryMobile && !basic.secondaryMobile.match(/^[6-9]\d{9}$/))
      return "Secondary Mobile is invalid";
    if (basic.pin && !basic.pin.match(/^\d{4,6}$/)) return "PIN must be 4-6 digits";
    // Password is the owner's seller-portal login credential — required on create.
    if (mode === "create" && !basic.password.trim()) return "Password is required";
    if (basic.password && basic.password.length < 6)
      return "Password must be at least 6 characters";
    return null;
  };

  const onSubmit = async () => {
    const err = validateOwner();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const ownerPayload = {
        fullName: basic.fullName.trim(),
        email: basic.email.trim() || undefined,
        mobile: basic.primaryMobile.trim(),
        businessName: locations[0]?.shopName || initialOwner?.businessName,
        profileImageUrl: avatarUrl || undefined,
        // Login credentials go top-level so the backend hashes them onto the
        // linked User account (never stored in the profile JSON below).
        password: basic.password.trim() || undefined,
        pin: basic.pin.trim() || undefined,
        address: {
          state: address.state || undefined,
          district: address.district || undefined,
          taluk: address.taluk || undefined,
          area: address.area || undefined,
          street: address.street || undefined,
          pincode: address.pincode || undefined,
          username: basic.username,
          shopControl: basic.shopControl,
          secondaryMobile: basic.secondaryMobile || undefined,
          idProofUrl: idProofUrl || undefined,
        },
      };

      const owner =
        mode === "edit" && ownerId
          ? await shopOwnersService.update(ownerId, ownerPayload)
          : await shopOwnersService.create(ownerPayload);

      // ---- Diff locations against original snapshot ----
      const currentIds = new Set(
        locations.filter((l) => l.__originalId).map((l) => l.__originalId as string)
      );

      // Delete shops that were removed from the list.
      const toRemove = [...originalIds].filter((id) => !currentIds.has(id));
      for (const id of toRemove) {
        try {
          await shopsService.remove(id);
        } catch (e) {
          console.warn("Failed to delete shop", id, e);
        }
      }

      // Save MAINs first, then BRANCHes — BRANCHes may reference a MAIN that
      // was added in the same session via "local:<index>" parentShopId.
      const indexedLocations = locations.map((loc, idx) => ({ loc, idx }));
      const mains = indexedLocations.filter((x) => x.loc.shopType === "MAIN");
      const branches = indexedLocations.filter((x) => x.loc.shopType === "BRANCH");
      const localIndexToBackendId = new Map<number, string>();

      const buildPayload = (loc: BusinessLocation, parentId?: string) => ({
        shopOwnerId: owner.id,
        shopName: loc.shopName,
        shopType: loc.shopType,
        parentShopId: parentId,
        businessType: loc.businessType,
        billingType: loc.billingType,
        contactMobile: loc.contactMobile,
        gstNumber: loc.gstNumber || undefined,
        state: loc.state || undefined,
        district: loc.district || undefined,
        taluk: loc.taluk || undefined,
        area: loc.area || undefined,
        street: loc.street || undefined,
        addressLine: loc.addressLine || undefined,
        pincode: loc.pincode || undefined,
        latitude: toCoord(loc.latitude),
        longitude: toCoord(loc.longitude),
        deliveryAvailable: loc.deliveryAvailable,
        workingDays: loc.workingDays || undefined,
        openingTime: loc.openingTime || undefined,
        closingTime: loc.closingTime || undefined,
        frontImageUrl: loc.frontImageUrl || undefined,
        bannerImageUrl: loc.bannerImageUrl || undefined,
        gstCertificateUrl: loc.gstCertificateUrl || undefined,
        udyamCertificateUrl: loc.udyamCertificateUrl || undefined,
        password: loc.password || undefined,
        pin: loc.pin || undefined,
      });

      for (const { loc, idx } of mains) {
        const payload = buildPayload(loc);
        if (loc.__originalId) {
          await shopsService.update(loc.__originalId, payload);
          localIndexToBackendId.set(idx, loc.__originalId);
        } else {
          const saved = await shopsService.create(payload);
          localIndexToBackendId.set(idx, String(saved.id));
        }
      }

      for (const { loc } of branches) {
        let parentId = loc.parentShopId;
        if (parentId && parentId.startsWith("local:")) {
          const localIdx = Number(parentId.slice("local:".length));
          parentId = localIndexToBackendId.get(localIdx);
        }
        if (!parentId) {
          throw new Error(
            `Branch "${loc.shopName}" has no parent MAIN shop — please select one.`
          );
        }
        const payload = buildPayload(loc, parentId);
        if (loc.__originalId) {
          await shopsService.update(loc.__originalId, payload);
        } else {
          await shopsService.create(payload);
        }
      }

      toast.success(
        mode === "edit"
          ? `Shop owner ${owner.name} updated`
          : `Shop owner ${owner.name} created with ${locations.length} location(s)`
      );
      router.push("/master/shop-owners");
    } catch (e) {
      toast.error(extractErrorMessage(e, "Failed to save shop owner"));
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = mode === "edit";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Shop Owner {isEdit ? "Workspace" : "Setup"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEdit ? "Edit Shop Owner" : "Create Shop Owner"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Update personal details, documents, and linked business locations."
              : "Create the shop owner account, then continue with business locations in the same workspace."}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/master/shop-owners">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop Owners
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="h-4 w-4" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FieldLabel label="Role">
              <Input value="Shop Owner" disabled />
            </FieldLabel>
            <FieldLabel label="Shop Control" required>
              <Select
                value={basic.shopControl}
                onValueChange={(v) => updateBasic("shopControl", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHOP_CONTROL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldLabel>
            <FieldLabel label="Full Name" required>
              <Input
                value={basic.fullName}
                onChange={(e) => updateBasic("fullName", e.target.value)}
                placeholder="Full Name"
              />
            </FieldLabel>
            <FieldLabel label="Username" required>
              <div className="flex gap-2">
                <Input
                  value={basic.username}
                  onChange={(e) => updateBasic("username", e.target.value)}
                  placeholder="Username"
                  disabled={isEdit}
                />
                {!isEdit && (
                  <Button
                    type="button"
                    onClick={() => updateBasic("username", genUsername(basic.fullName))}
                    className="shrink-0"
                  >
                    <Wand2 className="mr-1 h-4 w-4" /> Auto
                  </Button>
                )}
              </div>
            </FieldLabel>
            <FieldLabel label="Email Address" required>
              <Input
                type="email"
                value={basic.email}
                onChange={(e) => updateBasic("email", e.target.value)}
                placeholder="Email Address"
              />
            </FieldLabel>
            <FieldLabel label={isEdit ? "New Password" : "Password"} required={!isEdit}>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={basic.password}
                  onChange={(e) => updateBasic("password", e.target.value)}
                  placeholder={isEdit ? "Leave blank to keep" : "Min 6 characters"}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FieldLabel>
            <FieldLabel label={isEdit ? "New PIN" : "PIN"} required={!isEdit}>
              <div className="relative">
                <Input
                  type={showPin ? "text" : "password"}
                  value={basic.pin}
                  onChange={(e) => updateBasic("pin", e.target.value)}
                  placeholder={isEdit ? "Leave blank to keep" : "4-6 digit PIN"}
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
            <FieldLabel label="Primary Mobile" required>
              <Input
                type="tel"
                value={basic.primaryMobile}
                onChange={(e) => updateBasic("primaryMobile", e.target.value)}
                placeholder="Primary Mobile"
                maxLength={10}
              />
            </FieldLabel>
            <FieldLabel label="Secondary Mobile">
              <Input
                type="tel"
                value={basic.secondaryMobile}
                onChange={(e) => updateBasic("secondaryMobile", e.target.value)}
                placeholder="Secondary Mobile"
                maxLength={10}
              />
            </FieldLabel>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImagePlus className="h-4 w-4" /> Personal Profile & Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <FilePickerBox
              label="Avatar"
              hint="Profile image"
              accept="image/*"
              resource="image"
              folder="shop-owners/avatars"
              value={avatarUrl}
              onChange={setAvatarUrl}
              cta={isEdit ? "Change Avatar" : "Upload Avatar"}
            />
            <FilePickerBox
              label="ID Proof"
              hint="PDF or image"
              accept="image/*,application/pdf"
              resource="document"
              folder="shop-owners/id-proofs"
              value={idProofUrl}
              onChange={setIdProofUrl}
              cta={isEdit ? "Change ID Proof" : "Upload ID Proof"}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" /> Personal Address
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FieldLabel label="State" required>
              <StateSelect
                value={address.state}
                onChange={(v) => updateAddress("state", v)}
              />
            </FieldLabel>
            <FieldLabel label="District" required>
              <Input
                value={address.district}
                onChange={(e) => updateAddress("district", e.target.value)}
                placeholder="Select or type district"
              />
            </FieldLabel>
            <FieldLabel label="Taluk" required>
              <Input
                value={address.taluk}
                onChange={(e) => updateAddress("taluk", e.target.value)}
                placeholder="Select or type taluk"
              />
            </FieldLabel>
            <FieldLabel label="Area" required>
              <Input
                value={address.area}
                onChange={(e) => updateAddress("area", e.target.value)}
                placeholder="Select or type area"
              />
            </FieldLabel>
            <FieldLabel label="Street" required>
              <Input
                value={address.street}
                onChange={(e) => updateAddress("street", e.target.value)}
                placeholder="Street"
              />
            </FieldLabel>
            <FieldLabel label="Pincode" required>
              <Input
                value={address.pincode}
                onChange={(e) => updateAddress("pincode", e.target.value)}
                placeholder="Pincode"
                maxLength={6}
              />
            </FieldLabel>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" /> Business Locations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {locations.length > 0 && (
            <div className="space-y-2">
              {locations.map((loc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                >
                  <div className="flex-1">
                    <span className="font-medium">{loc.shopName}</span>{" "}
                    <span className="text-muted-foreground">
                      · {loc.shopType} · {loc.businessType} · {loc.billingType} · {loc.contactMobile}
                    </span>
                    {loc.__originalId && (
                      <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700 ring-1 ring-blue-200">
                        Existing
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editLocation(i)}
                      aria-label="Edit location"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLocation(i)}
                      aria-label="Remove location"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <Separator />
            </div>
          )}

          <div className="rounded-lg border p-4" id="new-location-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {editingLocationIdx !== null ? "Edit Business Location" : "New Business Location"}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={cancelLocationEdit}
                aria-label="Reset"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <FieldLabel label="Shop / Location Name" required>
                <ShopNameOsmSearch
                  value={draftLocation.shopName}
                  onValueChange={(v) => updateDraft("shopName", v)}
                  onPick={applyOsmFill}
                />
                <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                  Type 3+ characters to search OpenStreetMap. Picking a result
                  auto-fills street/area/district/state/pincode + lat/lng.
                </p>
              </FieldLabel>
              <FieldLabel label="Shop Type" required>
                <Select
                  value={draftLocation.shopType}
                  onValueChange={(v) => {
                    const next = v as ShopType;
                    setDraftLocation((d) => ({
                      ...d,
                      shopType: next,
                      parentShopId: next === "MAIN" ? undefined : d.parentShopId,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHOP_TYPE_OPTIONS.map((o) => (
                      <SelectItem
                        key={o.value}
                        value={o.value}
                        disabled={o.value === "BRANCH" && parentOptions.length === 0}
                      >
                        {o.label}
                        {o.value === "BRANCH" && parentOptions.length === 0 && " (need MAIN first)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldLabel>
              {draftLocation.shopType === "BRANCH" && (
                <FieldLabel label="Parent Shop" required>
                  <Select
                    value={draftLocation.parentShopId ?? ""}
                    onValueChange={(v) => updateDraft("parentShopId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent MAIN shop" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentOptions.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldLabel>
              )}
              <FieldLabel label="Business Type" required>
                <Select
                  value={draftLocation.businessType}
                  onValueChange={(v) => updateDraft("businessType", v as BusinessType)}
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
                  value={draftLocation.billingType}
                  onValueChange={(v) => updateDraft("billingType", v as BillingType)}
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
                  value={draftLocation.contactMobile}
                  onChange={(e) => updateDraft("contactMobile", e.target.value)}
                  placeholder="Mobile (also this location's login ID)"
                  maxLength={10}
                />
              </FieldLabel>
              <FieldLabel
                label={
                  draftLocation.__originalId ? "Location Login Password (new)" : "Location Login Password"
                }
              >
                <div className="relative">
                  <Input
                    type={showLocPassword ? "text" : "password"}
                    value={draftLocation.password}
                    onChange={(e) => updateDraft("password", e.target.value)}
                    placeholder={draftLocation.__originalId ? "Leave blank to keep" : "Min 6 chars (optional)"}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLocPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showLocPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showLocPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FieldLabel>
              <FieldLabel label="Location Login PIN">
                <div className="relative">
                  <Input
                    type={showLocPin ? "text" : "password"}
                    value={draftLocation.pin}
                    onChange={(e) => updateDraft("pin", e.target.value)}
                    placeholder={draftLocation.__originalId ? "Leave blank to keep" : "4-6 digits (optional)"}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="off"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLocPin((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showLocPin ? "Hide PIN" : "Show PIN"}
                    tabIndex={-1}
                  >
                    {showLocPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FieldLabel>
              <FieldLabel
                label="GST Number"
                required={
                  draftLocation.billingType === "GST" ||
                  draftLocation.billingType === "BOTH"
                }
              >
                <Input
                  value={draftLocation.gstNumber}
                  onChange={(e) => updateDraft("gstNumber", e.target.value)}
                  placeholder={
                    draftLocation.billingType === "NON_GST"
                      ? "Not applicable"
                      : "GST Number"
                  }
                  disabled={draftLocation.billingType === "NON_GST"}
                />
              </FieldLabel>
              <FieldLabel label="State" required>
                <StateSelect
                  value={draftLocation.state}
                  onChange={(v) => updateDraft("state", v)}
                />
              </FieldLabel>
              <FieldLabel label="District" required>
                <Input
                  value={draftLocation.district}
                  onChange={(e) => updateDraft("district", e.target.value)}
                  placeholder="District"
                />
              </FieldLabel>
              <FieldLabel label="Taluk" required>
                <Input
                  value={draftLocation.taluk}
                  onChange={(e) => updateDraft("taluk", e.target.value)}
                  placeholder="Taluk"
                />
              </FieldLabel>
              <FieldLabel label="Area" required>
                <Input
                  value={draftLocation.area}
                  onChange={(e) => updateDraft("area", e.target.value)}
                  placeholder="Area"
                />
              </FieldLabel>
              <FieldLabel label="Street" required>
                <Input
                  value={draftLocation.street}
                  onChange={(e) => updateDraft("street", e.target.value)}
                  placeholder="Street"
                />
              </FieldLabel>
              <FieldLabel label="Pincode" required>
                <Input
                  value={draftLocation.pincode}
                  onChange={(e) => updateDraft("pincode", e.target.value)}
                  placeholder="Pincode"
                  maxLength={6}
                />
              </FieldLabel>
              <FieldLabel label="Address Line">
                <Input
                  value={draftLocation.addressLine}
                  onChange={(e) => updateDraft("addressLine", e.target.value)}
                  placeholder="Building / landmark"
                />
              </FieldLabel>
              <FieldLabel label="Latitude">
                <Input
                  value={draftLocation.latitude}
                  onChange={(e) => updateDraft("latitude", e.target.value)}
                  placeholder="e.g. 13.0776"
                  inputMode="decimal"
                />
              </FieldLabel>
              <FieldLabel label="Longitude">
                <Input
                  value={draftLocation.longitude}
                  onChange={(e) => updateDraft("longitude", e.target.value)}
                  placeholder="e.g. 80.2917"
                  inputMode="decimal"
                />
              </FieldLabel>
              <FieldLabel label="Delivery" required>
                <Select
                  value={draftLocation.deliveryAvailable ? "true" : "false"}
                  onValueChange={(v) => updateDraft("deliveryAvailable", v === "true")}
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
                  value={draftLocation.workingDays || undefined}
                  onValueChange={(v) => updateDraft("workingDays", v)}
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
                  value={draftLocation.openingTime}
                  onChange={(e) => updateDraft("openingTime", e.target.value)}
                  placeholder="08:00 AM"
                />
              </FieldLabel>
              <FieldLabel label="Closing Time">
                <Input
                  value={draftLocation.closingTime}
                  onChange={(e) => updateDraft("closingTime", e.target.value)}
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

            <LiveLocationMap lat={draftLocation.latitude} lon={draftLocation.longitude} />

            <div className="mt-6 rounded-lg border p-4">
              <h4 className="mb-1 text-sm font-semibold">Location Proof Documents</h4>
              <p className="mb-4 text-xs text-muted-foreground">
                Add the shop front image and business proof documents for this location.
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <FilePickerBox
                  label="Front Image"
                  hint="Shop front photo"
                  accept="image/*"
                  resource="image"
                  folder="shops/front-images"
                  value={draftLocation.frontImageUrl}
                  onChange={(url) => updateDraft("frontImageUrl", url)}
                  cta="Upload Front Image"
                />
                <FilePickerBox
                  label="Shop Banner / Visiting Card"
                  hint="Banner board or visiting card"
                  accept="image/*"
                  resource="image"
                  folder="shops/banners"
                  value={draftLocation.bannerImageUrl}
                  onChange={(url) => updateDraft("bannerImageUrl", url)}
                  cta="Upload Banner"
                />
                <FilePickerBox
                  label="GST Certificate"
                  hint={
                    draftLocation.billingType === "NON_GST"
                      ? "Not applicable for Non-GST"
                      : "PDF or image (required)"
                  }
                  accept="image/*,application/pdf"
                  resource="document"
                  folder="shops/gst-certificates"
                  value={draftLocation.gstCertificateUrl}
                  onChange={(url) => updateDraft("gstCertificateUrl", url)}
                  cta="Upload GST Proof"
                  disabled={draftLocation.billingType === "NON_GST"}
                />
                <FilePickerBox
                  label="Udyam Certificate"
                  hint="PDF or image"
                  accept="image/*,application/pdf"
                  resource="document"
                  folder="shops/udyam-certificates"
                  value={draftLocation.udyamCertificateUrl}
                  onChange={(url) => updateDraft("udyamCertificateUrl", url)}
                  cta="Upload Udyam Proof"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={cancelLocationEdit}>
                Cancel
              </Button>
              <Button type="button" onClick={addLocationToList}>
                <Plus className="mr-2 h-4 w-4" />
                {editingLocationIdx !== null ? "Save Changes" : "Add to List"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/master/shop-owners")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isEdit ? "Save Changes" : "Save Shop Owner Details"}
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

function StateSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select state" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {INDIAN_STATES.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
  const [fileName, setFileName] = useState<string>("");
  const inputId = `file-${label.replace(/\s+/g, "-").toLowerCase()}`;

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
