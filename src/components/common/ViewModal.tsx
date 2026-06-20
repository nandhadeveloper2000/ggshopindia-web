"use client";
import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function ViewModal({ open, onOpenChange, title, children }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

interface InfoRowProps {
  label: string;
  value: ReactNode;
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b border-border/50 pb-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value ?? "—"}</span>
    </div>
  );
}
