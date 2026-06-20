"use client";

import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "./PageHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function SettingsPage() {
  const user = useCurrentUser();

  return (
    <>
      <PageHeader title="Settings" description="Manage your account and preferences." />
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input defaultValue={user?.name ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input defaultValue={user?.email ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label>Mobile</Label>
                <Input defaultValue={user?.mobile ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Input defaultValue={user?.role ?? ""} disabled />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={() => toast.success("Profile saved")}>Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Password</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Current password</Label>
                <Input type="password" />
              </div>
              <div className="space-y-1.5">
                <Label>New password</Label>
                <Input type="password" />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={() => toast.success("Password updated")}>Update password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Customize theme, notifications and defaults from here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
