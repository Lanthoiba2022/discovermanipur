"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";

/**
 * Root error boundary. Next 16 passes `retry`; older builds pass `reset`. We
 * accept either so the button always works.
 */
export default function GlobalError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  const recover = retry ?? reset;

  React.useEffect(() => {
    // Surface the failure for whatever reporting the deployment has wired up.
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="pt-28 md:pt-32">
      <div className="shell py-16 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto mb-8 flex size-16 items-center justify-center rounded-full border border-warning/40 bg-warning/10 text-warning">
            <AlertTriangle className="size-7" aria-hidden="true" />
          </span>

          <p className="eyebrow text-muted-foreground">Something went wrong</p>
          <h1 className="mt-5 text-headline">The road is blocked, not closed.</h1>
          <p className="mx-auto mt-6 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
            This part of the site failed to load. It is usually temporary. Try again, and if it
            keeps happening, tell us what you were doing and we will fix it.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => recover?.()} disabled={!recover}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Go to the homepage</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/contact">Report the problem</Link>
            </Button>
          </div>

          {error.digest && (
            <p className="mt-10 text-sm text-muted-foreground">
              Reference:{" "}
              <code className="rounded-[var(--radius-sm)] bg-muted px-2 py-1 font-mono text-xs">
                {error.digest}
              </code>
              <span className="block mt-2">Quote this if you get in touch; it helps us find it.</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
