import type { Metadata } from "next";

import { IntentLink } from "@/components/shared/intent-link";
import { UUID, n } from "@/components/admin/community-parts";
import { CommunityPhotoGrid } from "@/components/admin/community-photo-grid";
import { AdminUnavailable } from "@/components/admin/unavailable";
import { adminGetPerson, adminListPhotos } from "@/lib/community/queries";
import { requireAdmin } from "@/lib/host/role";

export const metadata: Metadata = {
  title: "Community photos",
  description:
    "Every photo uploaded to Discover Manipur community places, with its licence, author and uploader.",
};

const LIMIT = 300;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

function photosHref(params: { uploader?: string; place?: string; removed?: boolean }) {
  const search = new URLSearchParams();
  if (params.uploader) search.set("uploader", params.uploader);
  if (params.place) search.set("place", params.place);
  if (params.removed) search.set("removed", "1");
  const query = search.toString();
  return query ? `/admin/photos?${query}` : "/admin/photos";
}

const linkClass = "text-primary underline-offset-4 hover:underline";

export default async function AdminCommunityPhotosPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin("/admin/photos");

  const params = await searchParams;
  const rawUploader = one(params.uploader);
  const uploader = rawUploader && UUID.test(rawUploader) ? rawUploader : undefined;
  const rawPlace = one(params.place);
  const place = rawPlace && UUID.test(rawPlace) ? rawPlace : undefined;
  const removed = one(params.removed) === "1";

  const [photos, person] = await Promise.all([
    adminListPhotos({ uploaderId: uploader, placeId: place, includeRemoved: removed, limit: LIMIT }),
    uploader ? adminGetPerson(uploader) : Promise.resolve(null),
  ]);

  const uploaderName = uploader ? (person?.name ?? "an account that no longer exists") : null;
  const placeName = place ? (photos?.find((p) => p.placeId === place)?.placeName ?? "this place") : null;
  const removedCount = photos?.filter((p) => p.removedAt).length ?? 0;

  return (
    <section aria-labelledby="photos-heading">
      <h2 id="photos-heading" className="font-display text-2xl">
        Photos
      </h2>
      <p className="mb-6 mt-2 max-w-3xl text-sm text-muted-foreground">
        Every community photo, newest first, whatever the status of its place, including uploads
        not attached to a place yet.
        Check that the licence fits: a photo the uploader did not take needs a source page showing
        it may be reused. Removing a photo deletes the image file for good and keeps the record of
        the upload.
      </p>

      <div className="mb-5 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center">
        {uploaderName && (
          <p className="rounded-[var(--radius)] bg-muted px-4 py-2 text-foreground">
            Uploaded by <strong className="font-medium">{uploaderName}</strong> ·{" "}
            <IntentLink href={photosHref({ place, removed })} className={linkClass}>
              clear<span className="sr-only"> the uploader filter</span>
            </IntentLink>
          </p>
        )}
        {placeName && (
          <p className="rounded-[var(--radius)] bg-muted px-4 py-2 text-foreground">
            Photos of{" "}
            <IntentLink href={`/admin/places/${place}`} className="font-medium hover:underline">
              {placeName}
            </IntentLink>{" "}
            ·{" "}
            <IntentLink href={photosHref({ uploader, removed })} className={linkClass}>
              clear<span className="sr-only"> the place filter</span>
            </IntentLink>
          </p>
        )}
        <IntentLink href={photosHref({ uploader, place, removed: !removed })} className={linkClass}>
          {removed ? "Hide removed photos" : "Include removed photos"}
        </IntentLink>
        {photos && (
          <p className="text-muted-foreground sm:ml-auto">
            {photos.length === 1 ? "1 photo" : `${n(photos.length)} photos`}
            {removed && removedCount > 0 && `, ${n(removedCount)} removed`}
            {photos.length >= LIMIT && `, the ${LIMIT} most recent`}
          </p>
        )}
      </div>

      {!photos ? (
        <AdminUnavailable what="Photos" />
      ) : photos.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface p-10 text-center">
          <p className="font-display text-lg text-foreground">No photos to show</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {uploader || place || removed
              ? "Nothing matches these filters. Clear them to see every photo."
              : "Photos appear here as soon as someone uploads one with a community place."}
          </p>
        </div>
      ) : (
        <CommunityPhotoGrid photos={photos} showPlace />
      )}
    </section>
  );
}
