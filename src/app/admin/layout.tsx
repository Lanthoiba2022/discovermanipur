import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { getSessionUser } from "@/lib/host/role";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // The header only. The gate is `requireAdmin` in each page under /admin: a
  // layout does not re-render on client navigation and cannot stop a page from
  // rendering, and redirecting from here would lose which page was asked for.
  const user = await getSessionUser();
  if (user?.role !== "admin") return children;

  return (
    <div className="shell pb-24 pt-28 md:pt-32">
      <header className="mb-6">
        <p className="eyebrow mb-3 text-muted-foreground">Discover Manipur operations</p>
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
