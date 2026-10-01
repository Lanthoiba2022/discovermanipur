"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";

/**
 * Client-side route protection. The Neon Auth session cookie is refreshed (and
 * `/account` guarded server-side) in `src/proxy.ts`; this guard keeps signed-out
 * visitors out of the account shell, and is the only guard on the
 * local-development session, which the server cannot see.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
    }
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
          <Link href={`/auth?next=${encodeURIComponent(pathname)}`}>Sign in</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
