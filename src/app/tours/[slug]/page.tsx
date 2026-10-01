import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Check, Map, Mountain, Star, X } from "lucide-react";

import { MediaGallery } from "@/components/shared/media-gallery";
import { ItineraryTimeline } from "@/components/tours/itinerary-timeline";
import { TourBookingForm } from "@/components/tours/tour-booking-form";
import { formatDeparture, upcomingDepartures } from "@/components/tours/tour-filters";
import { Badge } from "@/components/ui/badge";
import { getTourBySlug, getTours } from "@/lib/data";

type Params = { slug: string };

/**
 * The catalogue is finite and fully enumerated by generateStaticParams, so a
 * slug outside that set does not exist. Without this, Next streams the page
 * (every detail route has a loading.tsx), flushing a 200 before notFound()
 * throws: a soft 404 that would let crawlers index any garbage URL.
 */
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  const rows = await getTours();
  return rows.map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) return { title: "Tour not found" };

  return {
    title: `${tour.title} · ${tour.durationDays}-day tour`,
    description: tour.description.slice(0, 160),
    openGraph: {
      title: tour.title,
      description: tour.description.slice(0, 160),
      images: tour.images[0] ? [{ url: tour.images[0].src }] : undefined,
    },
  };
}

export default async function TourDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  const departures = upcomingDepartures(tour.departureDates);

  return (
    <article className="pb-24">
      <div className="shell pt-28 md:pt-32">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/tours" className="hover:text-foreground">
            Tours
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-foreground">{tour.title}</span>
        </nav>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Badge variant="accent">
            {tour.durationDays} {tour.durationDays === 1 ? "day" : "days"}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {tour.difficulty}
          </Badge>
          {tour.themes.map((theme) => (
            <Badge key={theme} variant="primary" className="capitalize">
              {theme}
            </Badge>
          ))}
        </div>

        <h1 className="text-headline mt-4 max-w-4xl">{tour.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Map className="size-4" aria-hidden="true" />
            {tour.districtsCovered.length > 0
              ? tour.districtsCovered.join(" · ")
              : "Route being finalised"}
          </span>
          <span className="flex items-center gap-1.5 capitalize">
            <Mountain className="size-4" aria-hidden="true" />
            {tour.difficulty}
          </span>
          {tour.rating > 0 && (
            <span className="flex items-center gap-1.5">
              <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
              {tour.rating.toFixed(1)} · {tour.reviewCount} reviews
            </span>
          )}
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-12">
            <MediaGallery images={tour.images} title={tour.title} />

            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="font-display text-2xl">
                About this route
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {tour.description}
              </p>
            </section>

            <section aria-labelledby="itinerary-heading">
              <h2 id="itinerary-heading" className="font-display text-2xl">
                Day by day
              </h2>
              <div className="mt-8">
                <ItineraryTimeline days={tour.itinerary} />
              </div>
            </section>

            <section aria-labelledby="inclusions-heading">
              <h2 id="inclusions-heading" className="font-display text-2xl">
                What is and is not included
              </h2>
              <div className="mt-6 grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="eyebrow text-muted-foreground">Included</h3>
                  <ul className="mt-4 flex flex-col gap-3">
                    {tour.includes.length > 0 ? (
                      tour.includes.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-muted-foreground">
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-success"
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">Ask us for the full inclusions list.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="eyebrow text-muted-foreground">Not included</h3>
                  <ul className="mt-4 flex flex-col gap-3">
                    {tour.excludes.length > 0 ? (
                      tour.excludes.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-muted-foreground">
                          <X
                            className="mt-0.5 size-4 shrink-0 text-destructive"
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">
                        Flights and personal expenses are typically extra.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </section>

            <section
              aria-labelledby="departures-heading"
              className="rounded-[var(--radius-lg)] border border-border bg-surface-sunken p-6"
            >
              <h2 id="departures-heading" className="font-display text-2xl">
                Departures
              </h2>
              {departures.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {departures.map((date) => (
                    <li key={date}>
                      <Badge variant="outline">
                        <CalendarDays className="size-3.5" aria-hidden="true" />
                        {formatDeparture(date)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-muted-foreground">
                  No fixed departures listed. Tell us your dates and we will run this privately.
                </p>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <TourBookingForm tour={tour} />
          </aside>
        </div>
      </div>
    </article>
  );
}
