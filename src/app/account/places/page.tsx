import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { ImageOff, MapPinned, Plus } from "lucide-react";

import { IntentLink } from "@/components/shared/intent-link";
import { StatusBadge } from "@/components/community/status-badge";
import { VerifyEmailPanel } from "@/components/community/verify-email-panel";
import { Button } from "@/components/ui/button";
import { isAuthConfigured } from "@/lib/auth/env";
import { listMySubmissions } from "@/lib/community/queries";
import { UPVOTES_REQUIRED, VOTING_WINDOW_HOURS } from "@/lib/community/rules";
import { CATEGORY_LABELS } from "@/lib/community/taxonomy";
import type { MySubmission } from "@/lib/community/types";
import { getCommunityViewer } from "@/lib/community/viewer";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = {
  title: "My places",
  description: "The places you have listed on Discover Manipur, and where each one stands.",
  robots: { index: false, follow: false },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function Heading({ children }: { children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <h2 id="places-heading" className="font-display text-2xl">
          My places
        </h2>
        <p className="mt-2 text-muted-foreground">
          Places you have listed. Each one is published once {UPVOTES_REQUIRED} verified members upvote it
          within {VOTING_WINDOW_HOURS} hours, or held for an admin to review if it does not get there in time.{" "}
          <IntentLink href="/community#how-verification-works" className="text-primary underline underline-offset-4">
            How verification works
          </IntentLink>
        </p>
      </div>
      {children}
    </div>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken px-6 py-12 text-center">
      <h3 className="font-display text-xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">{children}</p>
    </div>
  );
}

function StatusDetail({ place }: { place: MySubmission }) {
  switch (place.status) {
    case "pending": {
      const upvotes = Math.min(place.upvotes, place.upvotesRequired);
      const percent = Math.round((upvotes / place.upvotesRequired) * 100);
      const labelId = `votes-${place.id}`;
      return (
        <div className="mt-3">
          <p id={labelId} className="text-sm text-foreground">
            {place.upvotes} of {place.upvotesRequired} upvotes
            <span className="text-muted-foreground">
              {" "}
              · {plural(place.hoursLeft, "hour", "hours")} left
            </span>
          </p>
          <div
            role="progressbar"
            aria-labelledby={labelId}
            aria-valuemin={0}
            aria-valuemax={place.upvotesRequired}
            aria-valuenow={upvotes}
            className="mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
        </div>
      );
    }
    case "held":
      return (
        <p className="mt-3 text-sm text-muted-foreground">
          {place.heldBy === "admin"
            ? "An admin has taken it off the public site to review it."
            : `Waiting for an admin to review it. It had ${plural(place.upvotes, "upvote", "upvotes")} when voting closed.`}
        </p>
      );
    case "rejected":
      return (
        <div className="mt-3 text-sm">
          <p className="text-muted-foreground">An admin decided not to publish this place.</p>
          {place.adminNote && (
            <blockquote className="mt-2 border-l-2 border-border-strong pl-3 text-foreground">
              <span className="sr-only">Note from the admin: </span>
              {place.adminNote}
            </blockquote>
          )}
        </div>
      );
    case "published":
      return (
        <p className="mt-3 text-sm text-muted-foreground">
          {place.publishedAt ? `Published on ${formatDate(place.publishedAt)}.` : "Published."} It is now
          public.
        </p>
      );
  }
}

function PlaceRow({ place }: { place: MySubmission }) {
  return (
    <li className="flex gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:p-5">
      <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-muted sm:size-24">
        {place.cover ? (
          <Image
            src={place.cover.thumbSrc}
            alt=""
            width={place.cover.width}
            height={place.cover.height}
            unoptimized
            className="size-full object-cover"
          />
        ) : (
          <ImageOff className="size-5 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-snug">
            <IntentLink href={`/community/${place.slug}`} className="underline-offset-4 hover:underline">
              {place.name}
            </IntentLink>
          </h3>
          <StatusBadge status={place.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {CATEGORY_LABELS[place.category]} · {place.district} · Listed on {formatDate(place.createdAt)}
          {place.photoCount > 0 && ` · ${plural(place.photoCount, "photo", "photos")}`}
        </p>
        {place.cover && <p className="mt-1 text-xs text-muted-foreground">{place.cover.credit}</p>}
        <StatusDetail place={place} />
      </div>
    </li>
  );
}

export default async function Page() {
  const available = isAuthConfigured && isDatabaseConfigured;
  const viewer = available ? await getCommunityViewer() : null;
  const places = viewer ? await listMySubmissions(viewer.userId) : null;

  const addButton = viewer?.canParticipate ? (
    <Button asChild>
      <IntentLink href="/community/new">
        <Plus aria-hidden="true" />
        Add a place
      </IntentLink>
    </Button>
  ) : null;

  return (
    <section aria-labelledby="places-heading">
      <Heading>{addButton}</Heading>

      {!available ? (
        <Notice title="Not available on this site yet">
          Listing places needs sign-in and a database, and this copy of the site has neither connected.
        </Notice>
      ) : !viewer ? (
        <Notice title="Sign in to see your places">
          Your listed places are tied to your account. Sign in again to see them.
        </Notice>
      ) : places === null ? (
        <Notice title="We could not load your places">
          Something went wrong on our side. Refresh the page to try again.
        </Notice>
      ) : places.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken px-6 py-16 text-center">
          <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPinned className="size-6" aria-hidden="true" />
          </span>
          <h3 className="font-display text-xl">No places listed yet</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">
            {viewer.canParticipate
              ? "Know somewhere visitors should not miss? List it, and verified members will vote on it."
              : viewer.banned
                ? "This account cannot list or vote on places."
                : "Verify your email address to list places and vote on them."}
          </p>
          {addButton && <div className="mt-6">{addButton}</div>}
          {!viewer.emailVerified && !viewer.banned && (
            <div className="mt-6 w-full">
              <VerifyEmailPanel email={viewer.email} />
            </div>
          )}
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {places.map((place) => (
            <PlaceRow key={place.id} place={place} />
          ))}
        </ul>
      )}
    </section>
  );
}
