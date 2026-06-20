"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "./PageHeader";
import { EmptyState } from "./EmptyState";
import { formatDateTime } from "@/lib/utils";
import { notificationsService } from "@/services/notifications.service";
import type { NotificationType } from "@/types/notification.types";

const TYPE_VARIANT: Record<NotificationType, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  INFO: "default",
  WARNING: "warning",
  ERROR: "destructive",
  SUCCESS: "success",
  ORDER: "default",
  STOCK: "warning",
  PAYMENT: "default",
  SYSTEM: "secondary",
};

export function NotificationsPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["notifications"], queryFn: notificationsService.list });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["notifications"] });

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Recent system, order, stock and payment notifications."
        actions={
          <Button
            variant="outline"
            className="gap-2"
            onClick={async () => {
              await notificationsService.markAllRead();
              invalidate();
            }}
          >
            <Check className="h-4 w-4" /> Mark all read
          </Button>
        }
      />
      <Card>
        <CardContent className="p-0">
          {data.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" />
          ) : (
            <ul className="divide-y">
              {data.map((n) => (
                <li key={n.id} className="flex items-start gap-3 p-4">
                  <div className="mt-0.5">
                    <Badge variant={TYPE_VARIANT[n.type]}>{n.type}</Badge>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={"text-sm " + (n.read ? "font-normal" : "font-semibold")}>{n.title}</p>
                      <span className="text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={async () => {
                      await notificationsService.remove(n.id);
                      invalidate();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
