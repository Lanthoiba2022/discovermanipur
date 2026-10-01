import {
  ArrowLeft,
  ArrowUpRight,
  CalendarCheck,
  CalendarPlus,
  CircleCheck,
  CirclePause,
  CircleX,
  Hourglass,
  Info,
  type LucideIcon,
  MapPin,
  Navigation,
  Tag,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, type ReactNode } from "react";

import { PageHero } from "@/components/content/page-hero";
import { PhotoGallery } from "@/components/community/photo-gallery";
import { formatCommunityDate } from "@/components/community/place-card";
import { StatusBadge } from "@/components/community/status-badge";
import { hoursLeftLabel, VoteButton } from "@/components/community/vote-button";
import { readParam, type RawSearchParams } from "@/components/filters";
import { Button } from "@/components/ui/button";
import { isAuthConfigured } from "@/lib/auth/env";
import { getPlaceForViewer } from "@/lib/community/queries";
import { UPVOTES_REQUIRED, VOTING_WINDOW_HOURS } from "@/lib/community/rules";
import { CATEGORY_LABELS, RELATIONSHIP_DISCLOSURES } from "@/lib/community/taxonomy";
import type { CommunityPlaceDetail } from "@/lib/community/types";
import { getCommunityViewer } from "@/lib/community/viewer";
import { isDatabaseConfigured } from "@/lib/db";

type Params = Promise<{ slug: string }>;

const NOINDEX = { index: false, follow: false } as const;

/**
 * The place as this viewer may see it, memoised per request so the metadata
 * and the page share one lookup. `null` when it does not exist, when the
 * viewer may not see it, or when the feature is switched off.
 */
const loadPlace = cache(async (slug: string): Promise<CommunityPlaceDetail | null> => {
  if (!isAuthConfigured || !isDatabaseConfigured) return null;
  const viewer = await getCommunityViewer();
  return getPlaceForViewer(slug, viewer);
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const place = await loadPlace(slug);

  if (!place) {
    return {
      title: "Place not found",
      description: "This community place does not exist, or it is not public.",
      robots: NOINDEX,
    };
  }

  if (place.status !== "published") {
    return { title: place.name, robots: NOINDEX };
  }

  const description = place.excerpt.slice(0, 180).trim();
  return {
    title: place.name,
    description,
    openGraph: {
      title: `${place.name} · ${place.district}, Manipur`,
      description,
      type: "article",
      images: place.cover
        ? [
            {
              url: place.cover.src,
              width: place.cover.width,
              height: place.cover.height,
              alt: place.cover.alt,
            },
          ]
        : undefined,
    },
  };
}

/** Split free text into paragraphs on blank lines. Rendered as text, never as HTML. */
function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-5">
      {paragraphs(text).map((para, i) => (
        <p key={i} className="whitespace-pre-line leading-relaxed text-muted-foreground">
          {para}
        </p>
      ))}
    </div>
  );
}

/** "example.org/path" for a source link: readable, and still the real address. */
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export default async function CommunityPlacePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<RawSearchParams>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const place = await loadPlace(slug);
  if (!place) notFound();

  const published = place.status === "published";
  const pending = place.status === "pending";
  const justListed = readParam(query, "listed") === "1" && place.isOwn && pending;
  const disclosure = RELATIONSHIP_DISCLOSURES[place.relationship];
  const coords = place.lat !== null && place.lng !== null ? { lat: place.lat, lng: place.lng } : null;
  const directionsUrl = coords
    ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`
    : null;
  const sources = place.sources.filter((url) => /^https?:\/\//i.test(url));

  return (
    <div className="pb-24">
      <PageHero
        tone="light"
        eyebrow={CATEGORY_LABELS[place.category]}
        title={place.name}
        lede={
          <p className="flex items-start gap-2">
            <MapPin className="mt-1.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              {place.location}, {place.district}
            </span>
          </p>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={place.status} />
          {directionsUrl && (
            <Button asChild variant="outline" size="pill">
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                <Navigation aria-hidden="true" />
                Get directions
                <span className="sr-only">(opens Google Maps in a new tab)</span>
              </a>
            </Button>
          )}
        </div>
      </PageHero>

      <div className="shell mt-10 md:mt-12">
        <Link
          href={published ? "/community" : "/community/verify"}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {published ? "All community places" : "Places waiting for votes"}
        </Link>

        {justListed && (
          <Notice icon={CircleCheck} tone="success" title="Your place is listed" live>
            It needs {UPVOTES_REQUIRED} upvotes from verified users within {VOTING_WINDOW_HOURS}{" "}
            hours to be published. Until then, only signed-in verified users can see it.
          </Notice>
        )}

        {!published && <StatusNotice place={place} />}
      </div>

      <div className="shell mt-12 grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
        <article className="min-w-0 max-w-3xl">
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-headline">
              About this place
            </h2>
            <div className="mt-6 text-lg">
              <Prose text={place.description} />
            </div>
          </section>

          {place.practicalDetails && (
            <section aria-labelledby="practical-heading" className="mt-14">
              <h2 id="practical-heading" className="font-display text-3xl">
                Practical details
              </h2>
              <div className="mt-5">
                <Prose text={place.practicalDetails} />
              </div>
            </section>
          )}

          <section aria-labelledby="photos-heading" className="mt-14">
            <h2 id="photos-heading" className="font-display text-3xl">
              Photos
            </h2>
            <PhotoGallery photos={place.photos} title={place.name} className="mt-6" />
          </section>

          {sources.length > 0 && (
            <section aria-labelledby="sources-heading" className="mt-14">
              <h2 id="sources-heading" className="font-display text-3xl">
                Sources
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Links added by the person who listed this place. They lead to other websites.
              </p>
              <ul className="mt-5 space-y-3">
                {sources.map((url) => (
                  <li key={url} className="flex gap-2 text-sm">
                    <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <a
                      href={url}
                      target="_blank"
                      rel="nofollow ugc noopener noreferrer"
                      className="min-w-0 break-all text-primary underline underline-offset-4 hover:no-underline"
                    >
                      {displayUrl(url)}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-14 border-t border-border pt-6 text-sm text-muted-foreground">
            This place was listed by a member of the community.{" "}
            <Link
              href="/community#how-verification-works"
              className="font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              How verification works
            </Link>
          </p>
        </article>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-28 lg:h-fit">
          {pending && (
            <section
              aria-labelledby="vote-heading"
              className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-sm)]"
            >
              <h2 id="vote-heading" className="eyebrow mb-5 text-muted-foreground">
                Community vote
              </h2>
              <VoteButton
                placeId={place.id}
                placeName={place.name}
                vote={place.vote}
                isOwn={place.isOwn}
              />
            </section>
          )}

          <section
            aria-labelledby="facts-heading"
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-sm)]"
          >
            <h2 id="facts-heading" className="eyebrow mb-5 text-muted-foreground">
              Quick facts
            </h2>
            <dl className="space-y-5 text-sm">
              <Fact icon={Tag} label="Kind of place" value={CATEGORY_LABELS[place.category]} />
              <Fact icon={MapPin} label="Where" value={`${place.location}, ${place.district}`} />
              {coords && (
                <Fact
                  icon={Navigation}
                  label="Coordinates"
                  value={`${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`}
                />
              )}
              {place.listedBy && <Fact icon={UserRound} label="Listed by" value={place.listedBy} />}
              <Fact icon={CalendarPlus} label="Listed on" value={formatCommunityDate(place.createdAt)} />
              {place.publishedAt && published && (
                <Fact
                  icon={CalendarCheck}
                  label="Published on"
                  value={formatCommunityDate(place.publishedAt)}
                />
              )}
            </dl>

            {disclosure && (
              <p className="mt-6 flex gap-2 border-t border-border pt-5 text-sm">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{disclosure}</span>
              </p>
            )}

            {directionsUrl && (
              <Button asChild variant="primary" size="pill" className="mt-7 w-full">
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                  <Navigation aria-hidden="true" />
                  Get directions
                  <span className="sr-only">(opens Google Maps in a new tab)</span>
                </a>
              </Button>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

/** Why a place the viewer can see is not public yet. */
function StatusNotice({ place }: { place: CommunityPlaceDetail }) {
  if (place.status === "pending") {
    return (
      <Notice icon={Hourglass} tone="info" title="This place is not public yet">
        It is collecting votes: {place.vote.upvotes} of {UPVOTES_REQUIRED} upvotes so far,{" "}
        {hoursLeftLabel(place.vote.hoursLeft).toLowerCase()}. Only signed-in users with a verified
        email address can see it until it is published.
      </Notice>
    );
  }
  if (place.status === "held") {
    return (
      <Notice icon={CirclePause} tone="info" title="This place is held for review">
        {place.heldBy === "admin"
          ? "An admin has taken it off the public site for review."
          : `It did not reach ${UPVOTES_REQUIRED} upvotes within ${VOTING_WINDOW_HOURS} hours, so an admin will review it by hand.`}{" "}
        It is not public, and only the person who listed it and the site&rsquo;s admins can see it.
      </Notice>
    );
  }
  return (
    <Notice icon={CircleX} tone="info" title="This place was not published">
      An admin reviewed it and decided not to publish it. It is not public, and only the person who
      listed it and the site&rsquo;s admins can see it.
    </Notice>
  );
}

function Notice({
  icon: Icon,
  tone,
  title,
  live = false,
  children,
}: {
  icon: LucideIcon;
  tone: "info" | "success";
  title: string;
  /** Announce on arrival, for a note that appears as the result of an action. */
  live?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role={live ? "status" : undefined}
      className={
        tone === "success"
          ? "mt-6 flex gap-4 rounded-[var(--radius-lg)] border border-primary/30 bg-primary/10 p-5"
          : "mt-6 flex gap-4 rounded-[var(--radius-lg)] border border-border-strong bg-surface-sand p-5"
      }
    >
      <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
        <dd className="mt-1 break-words leading-snug">{value}</dd>
      </div>
    </div>
  );
}
