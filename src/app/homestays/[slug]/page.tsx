import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BedDouble, Bath, MapPin, Star, Users } from "lucide-react";

import { IntentLink } from "@/components/shared/intent-link";
import { BookingCard } from "@/components/booking/booking-card";
import { AMENITY_META } from "@/components/homestays/amenities";
import { HomestayGallery } from "@/components/homestays/homestay-gallery";
import { HostCard } from "@/components/homestays/host-card";
import { RatingSummary } from "@/components/homestays/rating-summary";
import { SaveButton } from "@/components/homestays/save-button";
import { Separator } from "@/components/ui/separator";
import { getAllHomestaySlugs, getHomestayBySlug } from "@/lib/data";
import { ogImagesFor } from "@/lib/seo/og";

type Params = { params: Promise<{ slug: string }> };

/**
 * The catalogue is finite and fully enumerated by generateStaticParams, so a
 * slug outside that set does not exist. Without this, Next streams the page
 * (every detail route has a loading.tsx), flushing a 200 before notFound()
 * throws: a soft 404 that would let crawlers index any garbage URL.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getAllHomestaySlugs()).map((slug) => ({ slug }));
}

/**
 * Literal placeholders the research seed writes where a field was never
 * researched (see db/research-seed/0008_seed_2026_research.sql). The same set
 * as the concierge's in src/lib/ai/tools.ts: "Hosted by Host details to be
 * confirmed" is worse than saying nothing.
 */
const HOST_PLACEHOLDERS = new Set([
  "host details to be confirmed",
  "tbc",
  "to be confirmed",
  "n/a",
  "unknown",
]);

/** The host's name, or "" when the row holds a placeholder instead of one. */
function realHostName(name: string): string {
  const text = name.trim();
  return HOST_PLACEHOLDERS.has(text.toLowerCase()) ? "" : text;
}

/**
 * `YYYY-MM-DD` in India for the booking calendar's first render. This page is
 * static, so the value is the day it was rendered; the calendar moves to the
 * visitor's own today once it hydrates (see `StayDatePicker`). India because
 * that is where every stay is, and a fixed zone keeps the render reproducible
 * whatever region the build runs in.
 */
function calendarAnchor(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Below this, a description is a stub ("NEW.") rather than a snippet. */
const MIN_DESCRIPTION_LENGTH = 40;

/**
 * The meta and Open Graph description for a stay.
 *
 * About half the research rows carry a one-word description such as "NEW.",
 * which would otherwise become the search snippet and the share text. When
 * the description is too short to describe anything, a factual line is built
 * from the fields every row does have: the name, the place and the district,
 * plus the host's name only when it is a real name. Nothing is invented, so
 * the line stays true however sparse the row is.
 */
function homestayDescription(homestay: {
  title: string;
  description: string;
  location: string;
  district: string;
  hostName: string;
}): string {
  const own = homestay.description.trim();
  if (own.length >= MIN_DESCRIPTION_LENGTH) return own.slice(0, 155);

  const location = homestay.location.trim();
  const district = homestay.district.trim();
  // "Moirang, Bishnupur", or just the district when the location already
  // names it (or is missing), so the line never repeats itself.
  const place =
    location && !location.toLowerCase().includes(district.toLowerCase())
      ? `${location}, ${district}`
      : location || district;
  const host = realHostName(homestay.hostName);
  const hosted = host ? ` Hosted by ${host}.` : "";

  return `${homestay.title}, a homestay in ${place}, Manipur.${hosted}`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const homestay = await getHomestayBySlug(slug);

  if (!homestay) {
    return {
      title: "Homestay not found",
      description: "This Manipur homestay is no longer listed on Discover Manipur.",
    };
  }

  const description = homestayDescription(homestay);

  return {
    title: homestay.title,
    description,
    alternates: { canonical: `/homestays/${homestay.slug}` },
    openGraph: {
      title: `${homestay.title} · ${homestay.location}`,
      description,
      url: `/homestays/${homestay.slug}`,
      // 1200 px optimizer variant of a self-hosted photo, else the site card.
      images: ogImagesFor(homestay.images[0]),
      type: "website",
    },
  };
}

export default async function HomestayDetailPage({ params }: Params) {
  const { slug } = await params;
  const homestay = await getHomestayBySlug(slug);

  if (!homestay || !homestay.isActive) notFound();

  const amenities = homestay.amenities.filter((a) => AMENITY_META[a]);

  return (
    <article className="pb-24 pt-28 md:pt-32">
      <div className="shell">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <IntentLink href="/homestays" className="underline-offset-4 hover:underline">
                Stays
              </IntentLink>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground">{homestay.district}</li>
          </ol>
        </nav>

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-headline">{homestay.title}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden="true" />
                {homestay.location}, {homestay.district}
              </span>
              {homestay.reviewCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
                  <span className="font-medium text-foreground">
                    {homestay.rating.toFixed(1)}
                  </span>
                  ({homestay.reviewCount} reviews)
                </span>
              )}
            </p>
          </div>

          <SaveButton
            variant="inline"
            item={{
              kind: "homestay",
              slug: homestay.slug,
              title: homestay.title,
              subtitle: homestay.location,
              image: homestay.images[0]?.src,
              // Travels with the photo: a licence condition for Places photos.
              imageCredit: homestay.images[0]?.credit,
              href: `/homestays/${homestay.slug}`,
            }}
          />
        </header>

        <HomestayGallery images={homestay.images} title={homestay.title} />

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16">
          <div className="min-w-0 space-y-10">
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="font-display text-2xl">
                About this home
              </h2>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Users className="size-4" aria-hidden="true" /> Up to {homestay.maxGuests} guests
                </li>
                <li className="flex items-center gap-2">
                  <BedDouble className="size-4" aria-hidden="true" /> {homestay.bedrooms}{" "}
                  {homestay.bedrooms === 1 ? "bedroom" : "bedrooms"}
                </li>
                <li className="flex items-center gap-2">
                  <Bath className="size-4" aria-hidden="true" /> {homestay.bathrooms}{" "}
                  {homestay.bathrooms === 1 ? "bathroom" : "bathrooms"}
                </li>
              </ul>
              <p className="mt-5 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
                {homestay.description}
              </p>
            </section>

            <Separator />

            <HostCard homestay={homestay} />

            {amenities.length > 0 && (
              <>
                <Separator />
                <section aria-labelledby="amenities-heading">
                  <h2 id="amenities-heading" className="font-display text-2xl">
                    What this home offers
                  </h2>
                  <ul className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                    {amenities.map((a) => {
                      const meta = AMENITY_META[a];
                      const Icon = meta.icon;
                      return (
                        <li key={a} className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon className="size-4" aria-hidden="true" />
                          </span>
                          <span>{meta.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              </>
            )}

            {homestay.houseRules.length > 0 && (
              <>
                <Separator />
                <section aria-labelledby="rules-heading">
                  <h2 id="rules-heading" className="font-display text-2xl">
                    House rules
                  </h2>
                  <ul className="mt-5 space-y-3">
                    {homestay.houseRules.map((rule) => (
                      <li key={rule} className="flex gap-3 text-muted-foreground">
                        <span
                          aria-hidden="true"
                          className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent"
                        />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}

            {homestay.cancellationPolicy && (
              <>
                <Separator />
                <section aria-labelledby="cancellation-heading">
                  <h2 id="cancellation-heading" className="font-display text-2xl">
                    Cancellation policy
                  </h2>
                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    {homestay.cancellationPolicy}
                  </p>
                </section>
              </>
            )}

            <Separator />

            <RatingSummary rating={homestay.rating} reviewCount={homestay.reviewCount} />
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            {/* Only the fields the card reads cross into the client payload.
                A placeholder host name is passed as "", so the card says
                "your host" rather than "Host details to be confirmed". */}
            <BookingCard
              homestay={{
                slug: homestay.slug,
                title: homestay.title,
                hostName: realHostName(homestay.hostName),
                pricePerNight: homestay.pricePerNight,
                maxGuests: homestay.maxGuests,
                rating: homestay.rating,
                reviewCount: homestay.reviewCount,
              }}
              anchorDate={calendarAnchor()}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
