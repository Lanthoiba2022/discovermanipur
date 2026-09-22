import { FlaskConical } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Shown whenever Supabase credentials are absent. The mock session is real
 * enough to click through, and the label makes sure nobody mistakes it for a
 * secure account.
 */
export function DemoModeNotice({ className }: { className?: string }) {
  return (
    <div
      role="status"
      className={cn(
        "flex gap-3 rounded-[var(--radius)] border border-accent/45 bg-accent/12 p-4 text-sm",
        className,
      )}
    >
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-kangla-600" aria-hidden="true" />
      <p className="text-foreground">
        <span className="font-medium">Demo mode.</span> No authentication server is connected yet,
        so accounts, bookings and saved lists live in this browser only. Use any email and an
        8-character password — nothing is sent anywhere.
      </p>
    </div>
  );
}
