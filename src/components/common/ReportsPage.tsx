"use client";

import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "./PageHeader";

interface Props {
  title: string;
  description?: string;
  shops?: { label: string; value: string }[];
  statuses?: { label: string; value: string }[];
  onApply: (filters: { fromDate: string; toDate: string; shopId?: string; status?: string }) => void;
  children: React.ReactNode;
}

export function ReportsPage({ title, description, shops, statuses, onApply, children }: Props) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [shopId, setShopId] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </>
        }
      />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          {shops && (
            <div className="space-y-1.5">
              <Label className="text-xs">Shop</Label>
              <Select value={shopId} onValueChange={setShopId}>
                <SelectTrigger>
                  <SelectValue placeholder="All shops" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {statuses && (
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-end">
            <Button onClick={() => onApply({ fromDate, toDate, shopId, status })} className="w-full">
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="mt-4">{children}</div>
    </>
  );
}
