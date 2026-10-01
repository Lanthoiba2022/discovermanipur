import { CircleSlash, FlaskConical } from "lucide-react";

import { isDemoAuth } from "@/lib/auth/env";
import { cn } from "@/lib/utils";

/**
 * Shown whenever Neon Auth credentials are absent. In development the local
 * session is real enough to click through, and the label makes sure nobody
 * mistakes it for a secure account. A production build has no local session,
 * so it says sign-in is off instead.
 */
export function DemoModeNotice({ className }: { className?: string }) {
  const Icon = isDemoAuth ? FlaskConical : CircleSlash;
  return (
    <div
      role="status"
      className={cn(
        "flex gap-3 rounded-[var(--radius)] border border-accent/45 bg-accent/12 p-4 text-sm",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-kangla-600" aria-hidden="true" />
      {isDemoAuth ? (
        <p className="text-foreground">
          <span className="font-medium">Local development mode.</span> No authentication server
          is configured, so accounts, bookings and saved lists live in this browser only. Use any
          email and an 8-character password. Nothing is sent anywhere.
        </p>
      ) : (
        <p className="text-foreground">
          <span className="font-medium">Sign-in is unavailable.</span> This site has no
          authentication server connected right now, so accounts cannot be created or used. You
          can still browse everything and plan a trip.
        </p>
      )}
    </div>
  );
}
