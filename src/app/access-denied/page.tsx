import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/host/role";

export const metadata: Metadata = {
  title: "Access restricted",
  robots: { index: false, follow: false },
};

/**
 * Where `requireRole` (`@/lib/auth/dal`) sends a signed-in visitor whose role
 * does not cover the host dashboard, or anyone at all when this deployment has
 * no sign-in server. Signed-out visitors go to /auth instead. The admin area
 * never sends anyone here: it answers 404 so it is not advertised.
 */
export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const unavailable = params.reason === "unavailable";
  const user = unavailable ? null : await getSessionUser();

  const copy = unavailable
    ? {
        title: "Sign-in is not set up here",
        body: "This deployment has no sign-in server connected, so the host dashboard is closed. Everything else on the site works as normal.",
      }
    : {
        title: "For hosts with linked listings",
        body: "The host dashboard is for owners whose listings a Discover Manipur admin has linked to their account. Anyone signed in with a verified email can add their place for the community to verify. Every listing is held to the same hosting standards.",
      };

  return (
    <div className="shell pb-24 pt-28 md:pt-32">
      <div className="mx-auto max-w-md rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center shadow-[var(--shadow-sm)]">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-6" aria-hidden="true" />
        </span>
        <h1 className="font-display text-2xl">{copy.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{copy.body}</p>
        {user && (
          <p className="mt-3 text-sm text-muted-foreground">Signed in as {user.email}.</p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {unavailable ? (
            <Button asChild>
              <Link href="/">Back to Discover Manipur</Link>
            </Button>
          ) : (
            <>
              <Button asChild>
                <Link href="/community/new">Add your place</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/host/guidelines">Hosting standards</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
