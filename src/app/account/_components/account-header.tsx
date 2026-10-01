"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useAuth } from "@/lib/auth";

export function AccountHeader() {
  const { user, displayName, initials, demo, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-5">
      <div className="flex min-w-0 items-center gap-4">
        <Avatar className="size-14">
          {user?.avatarUrl?.startsWith("https://") && <AvatarImage src={user.avatarUrl} alt="" />}
          <AvatarFallback className="bg-primary/12 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-tight md:text-3xl">{displayName}</h1>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {demo && <Badge variant="accent">Demo account</Badge>}
        <SignOutButton />
      </div>
    </div>
  );
}
