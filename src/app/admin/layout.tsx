import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/host/role";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // The admin area is hidden: anyone who is not an admin gets a real 404.
  // Checked here as well as in every page because the layout renders before
  // `loading.tsx` starts streaming; a 404 decided later would already have
  // been sent with status 200, which would give the area away. The checks in
  // each page stay: a layout does not re-render on client navigation.
  const user = await requireAdmin("/admin");

  return (
    // `data-clarity-mask`: Clarity session replay blanks the whole admin area
    // before a recording leaves the browser. These pages render other
    // people's email addresses, bookings and moderation queues, and Clarity's
    // default masking covers typed input, not rendered text.
    <div data-clarity-mask="true" className="shell pb-24 pt-28 md:pt-32">
      <header className="mb-6">
        <p className="eyebrow mb-3 text-muted-foreground">Discover Manipur operations</p>
        <h1 className="font-display text-4xl leading-tight md:text-5xl">Admin</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Signed in as {user.name} ({user.email}). Applications, listings, bookings and community
          places across all sixteen districts.
        </p>
      </header>
      <AdminNav />
      <div className="pt-8">{children}</div>
    </div>
  );
}
