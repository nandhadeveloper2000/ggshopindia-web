"use client";
import { useRouter } from "next/navigation";
import { LogOut, Settings as SettingsIcon, UserCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth.store";
import { initials } from "@/lib/utils";
import { getRoleLabel } from "@/lib/roles";
import { getLoginPortalFor } from "@/lib/portals";

export function UserMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    const portal = getLoginPortalFor(user?.role);
    logout();
    router.replace(portal);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus:ring-2 focus:ring-ring">
        <Avatar className="h-9 w-9">
          {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {initials(user?.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.name ?? "Guest"}</span>
            <span className="text-xs text-muted-foreground">{getRoleLabel(user?.role)}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2">
          <UserCircle className="h-4 w-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <SettingsIcon className="h-4 w-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-destructive" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
