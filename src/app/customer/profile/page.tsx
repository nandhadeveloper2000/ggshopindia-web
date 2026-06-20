"use client";

import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { initials } from "@/lib/utils";

export default function CustomerProfilePage() {
  const user = useCurrentUser();

  return (
    <>
      <PageHeader title="Profile" description="Your account details and preferences." />
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary text-primary-foreground">{initials(user?.name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-base font-semibold">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input defaultValue={user?.name} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input defaultValue={user?.email} />
              </div>
              <div className="space-y-1.5">
                <Label>Mobile</Label>
                <Input defaultValue={user?.mobile} />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={() => toast.success("Profile saved")}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Saved addresses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage your shipping addresses.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Password & PIN</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input type="password" />
              </div>
              <div className="space-y-1.5">
                <Label>New PIN</Label>
                <Input type="password" maxLength={6} />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={() => toast.success("Updated")}>Update</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
