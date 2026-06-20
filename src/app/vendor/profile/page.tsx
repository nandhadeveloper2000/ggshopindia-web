"use client";

import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function VendorProfilePage() {
  const user = useCurrentUser();
  return (
    <>
      <PageHeader title="Vendor Profile" description="Your business information." />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Vendor Name</Label>
            <Input defaultValue={user?.name} />
          </div>
          <div className="space-y-1.5">
            <Label>Contact Person</Label>
            <Input />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input defaultValue={user?.email} />
          </div>
          <div className="space-y-1.5">
            <Label>Mobile</Label>
            <Input defaultValue={user?.mobile} />
          </div>
          <div className="space-y-1.5">
            <Label>GST Number</Label>
            <Input />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Input placeholder="Supplier / Distributor" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Address</Label>
            <Textarea rows={3} />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button onClick={() => toast.success("Profile saved")}>Save</Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
