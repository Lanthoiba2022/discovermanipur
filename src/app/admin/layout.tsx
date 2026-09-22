import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/host/role";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Role comes from the adapter in src/lib/host/role.ts — the single point that
  // swaps to real auth once src/lib/auth/* lands.
  const user = await getSessionUser();

  if (user?.role !== "admin") {
    return (
      <div className="shell pb-24 pt-28 md:pt-32">
        <div className="mx-auto max-w-md rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center shadow-[var(--shadow-sm)]">
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl">Admin access only</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This area is limited to the Manipur Tourism operations team. If you host with us, your own
            listings and bookings live in the host dashboard.
          </p>
          <Button asChild className="mt-6">
            <Link href="/host/dashboard">Go to host dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="shell pb-24 pt-28 md:pt-32">
      <header className="mb-6">
        <p className="eyebrow mb-3 text-muted-foreground">Manipur Tourism operations</p>
        <h1 className="font-display text-4xl leading-tight md:text-5xl">Admin</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Signed in as {user.name} ({user.email}). Applications, listings and bookings across all
          sixteen districts.
        </p>
      </header>
      <AdminNav />
      <div className="pt-8">{children}</div>
    </div>
  );
}
