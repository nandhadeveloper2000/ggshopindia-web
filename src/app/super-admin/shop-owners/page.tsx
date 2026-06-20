"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, MailCheck, MailX, Pencil } from "lucide-react";
import { CrudManagementPage } from "@/components/common/CrudManagementPage";
import { Button } from "@/components/ui/button";
import { computeProfileProgress, shopOwnersService } from "@/services/shopOwners.service";
import { shopsService } from "@/services/shops.service";
import { formatDate } from "@/lib/utils";
import { extractErrorMessage } from "@/lib/axios";
import type { ShopOwner } from "@/types/shop.types";

export default function ShopOwnersPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["shop-owners"],
    queryFn: shopOwnersService.list,
    refetchOnMount: "always",
    staleTime: 0,
  });

  // Pull shops once so we can attribute a location count to each owner without
  // making N calls.
  const { data: shops = [] } = useQuery({
    queryKey: ["shops"],
    queryFn: shopsService.list,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const locationCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of shops) {
      const k = String(s.shopOwnerId);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [shops]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["shop-owners"] });
    qc.invalidateQueries({ queryKey: ["shops"] });
  };

  return (
    <CrudManagementPage<ShopOwner>
      title="Shop Owners"
      description="Onboard and manage shop owners. New owners are Inactive until their email is verified."
      addHref="/super-admin/shop-owners/new"
      rows={data}
      searchKeys={["name", "username", "email", "mobile"]}
      showStatus={false}
      columns={[
        {
          key: "name",
          header: "Name",
          render: (r) => (
            <div>
              <div className="font-medium">{r.name}</div>
              {r.username && (
                <div className="text-xs text-muted-foreground">@{r.username}</div>
              )}
            </div>
          ),
        },
        { key: "email", header: "Email" },
        { key: "mobile", header: "Mobile" },
        {
          key: "_email_status",
          header: "Email Status",
          render: (r) =>
            r.isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                <MailCheck className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                <MailX className="h-3 w-3" /> Pending
              </span>
            ),
        },
        {
          key: "_progress",
          header: "Profile Progress",
          render: (r) => {
            const p = computeProfileProgress(r, locationCounts.get(String(r.id)) ?? 0);
            const tone =
              p.percent === 100
                ? "bg-emerald-500"
                : p.percent >= 60
                  ? "bg-blue-500"
                  : "bg-amber-500";
            return (
              <div className="min-w-[170px] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{p.percent}%</span>
                  <span className="text-muted-foreground">
                    {p.completed}/{p.total} complete
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${tone}`}
                    style={{ width: `${p.percent}%` }}
                  />
                </div>
                {p.missing.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Missing: {p.missing.join(", ")}
                  </p>
                )}
              </div>
            );
          },
        },
        {
          key: "_status",
          header: "Status",
          render: (r) =>
            r.isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Inactive
              </span>
            ),
        },
        {
          key: "createdAt",
          header: "Created",
          render: (r) => formatDate(r.createdAt),
        },
      ]}
      customActions={(row) => (
        <>
          <Button asChild size="icon" variant="ghost" className="h-8 w-8" aria-label="View">
            <Link href={`/super-admin/shop-owners/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="icon" variant="ghost" className="h-8 w-8" aria-label="Edit">
            <Link href={`/super-admin/shop-owners/${row.id}/edit`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
        </>
      )}
      onDelete={async (r) => {
        await shopOwnersService.remove(r.id);
        invalidate();
      }}
      onToggleStatus={async (r) => {
        try {
          await shopOwnersService.toggleStatus(r.id, !r.isActive);
          invalidate();
        } catch (e) {
          toast.error(extractErrorMessage(e, "Failed to update status"));
          throw e;
        }
      }}
    />
  );
}
