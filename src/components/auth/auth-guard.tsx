"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { Lock } from "lucide-react";

import { IntentLink } from "@/components/shared/intent-link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isAuthConfigured } from "@/lib/auth/env";
import { useAuth } from "@/lib/auth/use-auth";
import { hasSessionHint } from "@/lib/auth/session-hint";
import { refreshSession, setState as setAuthState } from "@/lib/auth/session-store";

/**
 * Client-side route protection. The Neon Auth session cookie is refreshed (and
 * `/account` guarded server-side) in `src/proxy.ts`; this guard keeps signed-out
 * visitors out of the account shell, and is the only guard on the
 * local-development session, which the server cannot see.
 *
 * One re-check before redirecting. The store skips the server when the browser
 * had no `dm_signed_in` hint at hydration, so a traveller whose session
 * predates the hint lands here signed out on a soft navigation, even though
 * the proxy has just recognised the session and set the hint on this very
 * request. Bouncing them to `/auth` and back costs two round trips and a
 * flash of the sign-in form. So when Neon Auth is configured, the store holds
 * no user and the hint is now present, the guard puts the store back into
 * "loading" (the skeleton stays up) and asks the server once. Whatever comes
 * back settles it: a user renders the page; `null` or a throw ends in the
 * redirect below, exactly as before. The ref keeps it to one check per mount,
 * so a hint that is present but stale cannot loop. The local-development
 * session never takes this path (`isAuthConfigured` is false there).
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const rechecked = useRef(false);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    if (!rechecked.current && isAuthConfigured && hasSessionHint()) {
      rechecked.current = true;
      // `refreshSession` always ends in "ready", with or without a user.
      setAuthState({ status: "loading" });
      void refreshSession();
      return;
    }
    router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Checking your session…</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken px-6 py-20 text-center">
        <span className="mb-6 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="size-6" aria-hidden="true" />
        </span>
        <h2 className="font-display text-2xl">This part is yours alone</h2>
        <p className="mt-3 max-w-sm text-muted-foreground">
          Sign in to see your bookings, your saved places and your profile.
        </p>
        <Button asChild className="mt-8">
          <IntentLink href={`/auth?next=${encodeURIComponent(pathname)}`}>Sign in</IntentLink>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
