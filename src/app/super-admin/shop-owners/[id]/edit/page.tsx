"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopOwnerForm } from "@/components/shop-owners/ShopOwnerForm";
import { shopOwnersService } from "@/services/shopOwners.service";
import { shopsService } from "@/services/shops.service";

export default function EditShopOwnerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ownerId = params.id;

  const { data: owner, isLoading: ownerLoading } = useQuery({
    queryKey: ["shop-owners", ownerId],
    queryFn: () => shopOwnersService.get(ownerId),
    enabled: Boolean(ownerId),
  });

  const { data: allShops = [], isLoading: shopsLoading } = useQuery({
    queryKey: ["shops"],
    queryFn: shopsService.list,
    refetchOnMount: "always",
  });

  const ownerShops = useMemo(
    () => allShops.filter((s) => String(s.shopOwnerId) === String(ownerId)),
    [allShops, ownerId]
  );

  if (ownerLoading || shopsLoading) {
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

  return (
    <ShopOwnerForm
      mode="edit"
      ownerId={String(ownerId)}
      initialOwner={owner}
      initialShops={ownerShops}
    />
  );
}
