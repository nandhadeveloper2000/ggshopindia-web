"use client";

import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/utils";
import { reviewsService } from "@/services/reviews.service";

export default function CustomerReviewsPage() {
  const { data = [] } = useQuery({ queryKey: ["reviews"], queryFn: () => reviewsService.list() });

  return (
    <>
      <PageHeader title="My Reviews" description="Reviews you have submitted." />
      {data.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" description="Buy and review products to see them here." />
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{r.productName}</p>
                  <div className="flex items-center text-warning text-sm">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
                {r.title && <p className="text-sm font-medium mt-1">{r.title}</p>}
                <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>
                <p className="text-xs text-muted-foreground mt-2">{formatDate(r.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
