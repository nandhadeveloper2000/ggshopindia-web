"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  FileText,
  Image as ImageIcon,
  Loader2,
  MailCheck,
  MailX,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeProfileProgress, shopOwnersService } from "@/services/shopOwners.service";
import { shopsService } from "@/services/shops.service";
import { extractErrorMessage } from "@/lib/axios";
import { formatDate } from "@/lib/utils";
import type { Shop } from "@/types/shop.types";
import { BusinessLocationInlineForm } from "@/components/shop-owners/BusinessLocationInlineForm";

const SHOP_CONTROL_LABEL: Record<string, string> = {
  INVENTORY_ONLY: "Inventory Only",
  INVENTORY_AND_ECOMMERCE: "Inventory + Ecommerce Only",
};

export default function ShopOwnerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const ownerId = params.id;
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);

  const { data: owner, isLoading } = useQuery({
    queryKey: ["shop-owners", ownerId],
    queryFn: () => shopOwnersService.get(ownerId),
    enabled: Boolean(ownerId),
  });

  const { data: allShops = [] } = useQuery({
    queryKey: ["shops"],
    queryFn: shopsService.list,
    refetchOnMount: "always",
  });

  const shops = useMemo(
    () => allShops.filter((s) => String(s.shopOwnerId) === String(ownerId)),
    [allShops, ownerId]
  );

  const progress = useMemo(
    () => (owner ? computeProfileProgress(owner, shops.length) : null),
    [owner, shops.length]
  );

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Shop owner not found.</p>
        <Button variant="outline" onClick={() => router.push("/super-admin/shop-owners")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop Owners
        </Button>
      </div>
    );
  }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["shop-owners", ownerId] });
    qc.invalidateQueries({ queryKey: ["shop-owners"] });
    qc.invalidateQueries({ queryKey: ["shops"] });
  };

  const handleToggleActive = async () => {
    try {
      await shopOwnersService.toggleStatus(owner.id, !owner.isActive);
      toast.success(`Shop owner ${owner.isActive ? "deactivated" : "activated"}`);
      invalidate();
    } catch (e) {
      toast.error(extractErrorMessage(e, "Failed to update status"));
    }
  };

  const initials = (owner.name || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shop Owner Details</h1>
          <p className="text-sm text-muted-foreground">
            Review account information, documents, and business locations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/super-admin/shop-owners/${ownerId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/super-admin/shop-owners">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop Owners
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold">
            {owner.profileImageUrl ? (
              <Image src={owner.profileImageUrl} alt={owner.name} />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{owner.name}</h2>
            <p className="text-sm text-muted-foreground">
              View personal details, verification status, documents, and linked business locations
              for this shop owner.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {owner.isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                  <MailCheck className="h-3 w-3" /> Email Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                  <MailX className="h-3 w-3" /> Email Pending
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                  owner.isActive
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-muted text-muted-foreground ring-border"
                }`}
              >
                <ShieldCheck className="h-3 w-3" />
                {owner.isActive ? "Active" : "Inactive"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                <Building2 className="h-3 w-3" /> {shops.length} Business Location
                {shops.length === 1 ? "" : "s"}
              </span>
              {progress && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                  Profile {progress.percent}%
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleToggleActive} size="sm" variant="outline">
              {owner.isActive ? "Deactivate" : "Activate"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="h-4 w-4" /> Personal Details
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Owner identity, contact details, account status, and control mode.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <DetailRow label="Full Name" value={owner.name} />
            <DetailRow label="Username" value={owner.username} />
            <DetailRow label="Email ID" value={owner.email} />
            <DetailRow label="Primary Mobile" value={owner.mobile} />
            <DetailRow label="Secondary Mobile" value={owner.secondaryMobile} />
            <DetailRow
              label="Shop Control"
              value={
                owner.shopControl
                  ? SHOP_CONTROL_LABEL[owner.shopControl] ?? owner.shopControl
                  : undefined
              }
            />
            <DetailRow
              label="Email Status"
              value={owner.isVerified ? "Verified" : "Pending"}
            />
            <DetailRow label="Status" value={owner.isActive ? "Active" : "Inactive"} />
            <DetailRow label="Valid To" value={owner.validTo ? formatDate(owner.validTo) : "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" /> Personal Address
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Mapped location and street details stored for this shop owner.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <DetailRow label="State" value={owner.address?.state} />
            <DetailRow label="District" value={owner.address?.district} />
            <DetailRow label="Taluk" value={owner.address?.taluk} />
            <DetailRow label="Area" value={owner.address?.area} />
            <DetailRow label="Street" value={owner.address?.street} />
            <DetailRow label="Pincode" value={owner.address?.pincode} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" /> Personal Profile & Documents
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Uploaded avatar, ID proof preview, and account timeline.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DocPreview label="Avatar" url={owner.profileImageUrl} kind="image" />
            <DocPreview label="ID Proof" url={owner.idProofUrl} kind="doc" />
            <DetailRow label="Created On" value={formatDate(owner.createdAt)} />
            <DetailRow label="Expiry Date" value={owner.validTo ? formatDate(owner.validTo) : "—"} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" /> Business Locations
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Business locations linked to this shop owner account.
            </p>
          </div>
          {!showAddLocation && !editingShop && (
            <Button
              size="sm"
              onClick={() => {
                setEditingShop(null);
                setShowAddLocation(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Business Location
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {(showAddLocation || editingShop) && (
            <BusinessLocationInlineForm
              ownerId={String(ownerId)}
              shop={editingShop ?? undefined}
              ownerShops={shops}
              onSaved={() => {
                setShowAddLocation(false);
                setEditingShop(null);
                invalidate();
              }}
              onCancel={() => {
                setShowAddLocation(false);
                setEditingShop(null);
              }}
            />
          )}

          {shops.length === 0 ? (
            !showAddLocation && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No business locations linked yet.
              </p>
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">S.No</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Business Type</th>
                    <th className="px-4 py-3">Mobile</th>
                    <th className="px-4 py-3">Address</th>
                    <th className="px-4 py-3">Billing</th>
                    <th className="px-4 py-3">Documents</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {shops.map((shop, i) => (
                    <ShopRow
                      key={shop.id}
                      idx={i + 1}
                      shop={shop}
                      onEdit={() => {
                        setShowAddLocation(false);
                        setEditingShop(shop);
                      }}
                      onDelete={async () => {
                        if (!confirm(`Delete location "${shop.shopName ?? shop.name ?? "Unnamed"}"?`)) return;
                        try {
                          await shopsService.remove(shop.id);
                          toast.success("Location deleted");
                          invalidate();
                        } catch (e) {
                          toast.error(extractErrorMessage(e, "Failed to delete"));
                        }
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <span className="col-span-1 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="col-span-2 break-words">{value && value.length > 0 ? value : "—"}</span>
    </div>
  );
}

function Image({ src, alt }: { src: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="h-16 w-16 rounded-full object-cover" />;
}

function DocPreview({
  label,
  url,
  kind,
}: {
  label: string;
  url?: string;
  kind: "image" | "doc";
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <span className="col-span-1 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="col-span-2">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary underline"
          >
            {kind === "image" ? (
              <ImageIcon className="h-3 w-3" />
            ) : (
              <FileText className="h-3 w-3" />
            )}
            View
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">
            No {label.toLowerCase()} uploaded.
          </span>
        )}
      </span>
    </div>
  );
}

function ShopRow({
  idx,
  shop,
  onEdit,
  onDelete,
}: {
  idx: number;
  shop: Shop;
  onEdit: () => void;
  onDelete: () => void;
}) {
  type Documents = { frontImageUrl?: string; gstCertificateUrl?: string; udyamCertificateUrl?: string };
  type ShopWithExtras = Shop & {
    name?: string;
    mobile?: string;
    settings?: { businessType?: string; billingType?: string; documents?: Documents };
  };
  const s = shop as ShopWithExtras;
  const docs = s.settings?.documents ?? {};
  const missingDocs: string[] = [];
  if (!docs.frontImageUrl) missingDocs.push("Front Image");
  if (!docs.gstCertificateUrl) missingDocs.push("GST Cert");
  if (!docs.udyamCertificateUrl) missingDocs.push("Udyam Cert");

  const displayName = s.shopName ?? s.name ?? "Unnamed";
  const displayMobile = s.contactMobile ?? s.mobile ?? "—";
  const addressParts = [shop.state, shop.district, shop.taluk, shop.area, shop.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <tr className="hover:bg-muted/30">
      <td className="px-4 py-3 align-top">{idx}</td>
      <td className="px-4 py-3 align-top">
        <div className="font-medium">{displayName}</div>
        <div className="text-xs text-muted-foreground">{shop.shopType}</div>
      </td>
      <td className="px-4 py-3 align-top">{s.settings?.businessType ?? shop.businessType ?? "—"}</td>
      <td className="px-4 py-3 align-top">{displayMobile}</td>
      <td className="px-4 py-3 align-top max-w-xs">{addressParts || "—"}</td>
      <td className="px-4 py-3 align-top">
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
          {s.settings?.billingType ?? shop.billingType ?? "—"}
        </span>
      </td>
      <td className="px-4 py-3 align-top">
        {missingDocs.length === 0 ? (
          <span className="text-xs text-emerald-700">All uploaded</span>
        ) : (
          <span className="text-xs text-amber-700">
            Missing: {missingDocs.join(", ")}
          </span>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        {shop.isActive ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            Active
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Inactive
          </span>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onEdit}
            aria-label="Edit location"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive"
            onClick={onDelete}
            aria-label="Delete location"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
