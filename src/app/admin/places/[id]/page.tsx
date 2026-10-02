import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { IntentLink } from "@/components/shared/intent-link";
import { CommunityDecisionPanel } from "@/components/admin/community-decision-panel";
import {
  CommunityStatusPill,
  RelationshipFlag,
  UUID,
  formatDateTime,
  n,
} from "@/components/admin/community-parts";
import { CommunityPhotoGrid } from "@/components/admin/community-photo-grid";
import { AdminUnavailable } from "@/components/admin/unavailable";
import { adminGetPlace } from "@/lib/community/queries";
import { UPVOTES_REQUIRED, VOTING_WINDOW_HOURS, hoursLeft } from "@/lib/community/rules";
import { CATEGORY_LABELS, RELATIONSHIP_LABELS } from "@/lib/community/taxonomy";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/host/role";

export const metadata: Metadata = {
  title: "Review community place",
  description: "Review one community place: its details, photos, votes and who listed it.",
};

type Params = Promise<{ id: string }>;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-[var(--radius-lg)] border border-border bg-surface p-6"
    >
      <h3 id={id} className="font-display text-xl">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{children}</dd>
    </div>
  );
}

export default async function AdminCommunityPlacePage({ params }: { params: Params }) {
  const { id } = await params;
  const valid = UUID.test(id);
  await requireAdmin(valid ? `/admin/places/${id}` : "/admin/places");
  if (!valid) notFound();

  const place = await adminGetPlace(id);
  if (!place) {
    // `adminGetPlace` answers null both for a missing row and for a failed read.
    if (!getDb()) return <AdminUnavailable what="This place" />;
    notFound();
  }

  const now = new Date();
  const votingEnds = new Date(place.votingEndsAt);
  const votingOpen = place.status === "pending" && votingEnds > now;
  // A place can leave voting early (published by votes, or decided by an
  // admin), so "the window closed" is only true once its end has passed.
  const windowPassed = votingEnds <= now;
  const left = hoursLeft(votingEnds, now);
  const livePhotos = place.photos.filter((p) => !p.removedAt).length;
  const removedPhotos = place.photos.length - livePhotos;
  const mapsUrl =
    place.lat !== null && place.lng !== null
      ? `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
      : null;

  return (
    <article aria-labelledby="place-heading">
      <IntentLink
        href="/admin/places"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to the review queue
      </IntentLink>

      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CommunityStatusPill status={place.status} />
            <RelationshipFlag relationship={place.relationship} />
          </div>
          <h2 id="place-heading" className="font-display text-3xl leading-tight">
            {place.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {CATEGORY_LABELS[place.category]} · {place.location}, {place.district}
          </p>
        </div>
        <div className="text-sm">
          <a
            href={`/community/${place.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
          >
            Open the place page
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          {place.status !== "published" && (
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Not public. You can see it because you are an admin.
            </p>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Section id="details-heading" title="What was listed">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Field label="Description" wide>
                <span className="block whitespace-pre-line leading-relaxed">{place.description}</span>
              </Field>
              <Field label="Practical details" wide>
                {place.practicalDetails ? (
                  <span className="block whitespace-pre-line leading-relaxed">{place.practicalDetails}</span>
                ) : (
                  <span className="text-muted-foreground">None given</span>
                )}
              </Field>
              <Field label="Category">{CATEGORY_LABELS[place.category]}</Field>
              <Field label="District">{place.district}</Field>
              <Field label="Location" wide>
                {place.location}
              </Field>
              <Field label="Coordinates" wide>
                {mapsUrl ? (
                  <>
                    <span className="tabular-nums">
                      {place.lat?.toFixed(6)}, {place.lng?.toFixed(6)}
                    </span>{" "}
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="ml-1 inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                    >
                      <MapPin className="size-3.5" aria-hidden="true" />
                      View on Google Maps
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </>
                ) : (
                  <span className="text-muted-foreground">Not given</span>
                )}
              </Field>
              <Field label="Sources" wide>
                {place.sources.length > 0 ? (
                  <ul className="flex flex-col gap-1">
                    {place.sources.map((source) => (
                      <li key={source} className="min-w-0">
                        <a
                          href={source}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex max-w-full items-center gap-1 break-all text-primary underline-offset-4 hover:underline"
                        >
                          {source}
                          <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground">None given</span>
                )}
              </Field>
            </dl>
          </Section>

          <Section id="photos-heading" title={`Photos (${n(place.photos.length)})`}>
            <p className="mb-4 text-sm text-muted-foreground">
              {livePhotos === 1 ? "1 photo is live" : `${n(livePhotos)} photos are live`}
              {removedPhotos > 0 && `, ${n(removedPhotos)} removed`}. Check each licence and
              source: a photo the uploader did not take needs a link showing it may be reused.
            </p>
            {place.photos.length > 0 ? (
              <CommunityPhotoGrid photos={place.photos} size="large" />
            ) : (
              <p className="rounded-[var(--radius)] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No photos were added to this place.
              </p>
            )}
          </Section>
        </div>

        <div className="flex flex-col gap-6">
          <section
            aria-label="Decision"
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-6"
          >
            <CommunityDecisionPanel placeId={place.id} placeName={place.name} status={place.status} />
          </section>

          <Section id="submitter-heading" title="Listed by">
            {place.submitter ? (
              <dl className="grid gap-4">
                <Field label="Name">{place.submitter.name}</Field>
                <Field label="Email">
                  <a href={`mailto:${place.submitter.email}`} className="break-all hover:underline">
                    {place.submitter.email}
                  </a>
                </Field>
                <Field label="Connection to the place">
                  <span className="block">{RELATIONSHIP_LABELS[place.relationship]}</span>
                  {place.relationship !== "none" && (
                    <span className="mt-1 block text-xs text-warning">
                      They disclosed a connection, so weigh the description and photos with that in mind.
                    </span>
                  )}
                </Field>
                <Field label="Their other contributions">
                  <span className="flex flex-col gap-1">
                    <IntentLink
                      href={`/admin/places?submitter=${place.submitter.id}&status=all`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Places they listed
                    </IntentLink>
                    <IntentLink
                      href={`/admin/photos?uploader=${place.submitter.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Photos they uploaded
                    </IntentLink>
                  </span>
                </Field>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                The account that listed this place no longer exists. Connection disclosed:{" "}
                {RELATIONSHIP_LABELS[place.relationship]}.
              </p>
            )}
          </Section>

          <Section id="votes-heading" title="Votes">
            <p className="text-3xl font-semibold tabular-nums leading-none">
              {n(place.upvotes)} <span className="text-base font-normal text-muted-foreground">/ {UPVOTES_REQUIRED} upvotes</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {votingOpen
                ? `Voting is open for ${left === 1 ? "1 more hour" : `${left} more hours`}, until ${formatDateTime(place.votingEndsAt)}.`
                : windowPassed
                  ? `The ${VOTING_WINDOW_HOURS}-hour voting window closed on ${formatDateTime(place.votingEndsAt)}.`
                  : `Voting stopped early, when the place was published or decided. The window would have closed on ${formatDateTime(place.votingEndsAt)}.`}
            </p>
          </Section>

          <Section id="timeline-heading" title="Timeline">
            <ol className="flex flex-col gap-4 border-l border-border pl-4 text-sm">
              <li>
                <p className="font-medium text-foreground">Listed</p>
                <p className="text-muted-foreground">
                  {formatDateTime(place.createdAt)}
                  {place.submitter && ` by ${place.submitter.name}`}
                </p>
              </li>
              <li>
                <p className="font-medium text-foreground">{votingOpen ? "Voting ends" : windowPassed ? "Voting ended" : "Voting window would have ended"}</p>
                <p className="text-muted-foreground">{formatDateTime(place.votingEndsAt)}</p>
              </li>
              {place.publishedAt && (
                <li>
                  <p className="font-medium text-foreground">First published</p>
                  <p className="text-muted-foreground">{formatDateTime(place.publishedAt)}</p>
                </li>
              )}
              {place.decidedAt ? (
                <li>
                  <p className="font-medium text-foreground">Latest admin decision</p>
                  <p className="text-muted-foreground">
                    {formatDateTime(place.decidedAt)} by {place.decidedBy?.name ?? "a former admin"}
                    {place.decidedBy && (
                      <span className="block break-all text-xs">{place.decidedBy.email}</span>
                    )}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Now: <CommunityStatusPill status={place.status} className="ml-1 align-middle" />
                  </p>
                  {place.adminNote ? (
                    <blockquote className="mt-2 whitespace-pre-line rounded-[var(--radius)] bg-muted p-3 text-foreground">
                      {place.adminNote}
                    </blockquote>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">No note was left.</p>
                  )}
                </li>
              ) : (
                <li>
                  <p className="font-medium text-foreground">Admin decision</p>
                  <p className="text-muted-foreground">
                    {place.status === "published"
                      ? "None needed: the community voted it through."
                      : "None yet."}
                  </p>
                </li>
              )}
            </ol>
          </Section>
        </div>
      </div>
    </article>
  );
}
