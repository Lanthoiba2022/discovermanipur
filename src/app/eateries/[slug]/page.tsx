import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Leaf, MapPin, Phone, Star } from "lucide-react";

import { IntentLink } from "@/components/shared/intent-link";
import { MediaGallery } from "@/components/shared/media-gallery";
import {
  mapsHref,
  priceRangeLabel,
} from "@/components/eateries/eatery-filters";
import { TableReservationForm } from "@/components/eateries/table-reservation-form";
import { titleCase } from "@/components/filters";
import { Badge } from "@/components/ui/badge";
import { formatINR, meiteiAlias } from "@/lib/utils";
import { getEateries, getEateryBySlug } from "@/lib/data";
import { ogImagesFor } from "@/lib/seo/og";

type Params = { slug: string };

/**
 * The catalogue is finite and fully enumerated by generateStaticParams, so a
 * slug outside that set does not exist. Without this, Next streams the page
 * (every detail route has a loading.tsx), flushing a 200 before notFound()
 * throws: a soft 404 that would let crawlers index any garbage URL.
 */
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  const rows = await getEateries();
  return rows.map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const eatery = await getEateryBySlug(slug);
  if (!eatery) return { title: "Restaurant not found" };

  return {
    title: eatery.name,
    description: eatery.description.slice(0, 160),
    openGraph: {
      title: eatery.name,
      description: eatery.description.slice(0, 160),
      // Places refs expire; only self-hosted files are safe for scrapers.
      // 1200 px optimizer variant of a self-hosted photo, else the site card.
      images: ogImagesFor(eatery.images[0]),
    },
  };
}

export default async function EateryDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const eatery = await getEateryBySlug(slug);
  if (!eatery) notFound();

  const signature = eatery.signatureDishes.filter((dish) => dish.isSignature);
  const rest = eatery.signatureDishes.filter((dish) => !dish.isSignature);
  const menu = [...signature, ...rest];

  return (
    <article className="pb-24">
      <div className="shell pt-28 md:pt-32">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <IntentLink href="/eateries" className="hover:text-foreground">
            Eateries
          </IntentLink>
          <span aria-hidden="true"> / </span>
          <span className="text-foreground">{eatery.name}</span>
        </nav>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {eatery.cuisines.map((cuisine) => (
            <Badge key={cuisine} variant="accent">
              {titleCase(cuisine)}
            </Badge>
          ))}
          <Badge variant="outline">
            <span aria-hidden="true">{priceRangeLabel(eatery.priceRange)}</span>
            <span className="sr-only">Price range {eatery.priceRange} of 3</span>
          </Badge>
        </div>

        <h1 className="text-headline mt-4 max-w-4xl">{eatery.name}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden="true" />
            {eatery.location}, {eatery.district}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden="true" />
            {eatery.timings}
          </span>
          {eatery.rating > 0 && (
            <span className="flex items-center gap-1.5">
              <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
              {eatery.rating.toFixed(1)} · {eatery.reviewCount} reviews
            </span>
          )}
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-12">
            <MediaGallery images={eatery.images} title={eatery.name} />

            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="font-display text-2xl">
                About
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {eatery.description}
              </p>
            </section>

            <section aria-labelledby="menu-heading">
              <h2 id="menu-heading" className="font-display text-2xl">
                Signature dishes
              </h2>
              {menu.length === 0 ? (
                <p className="mt-4 text-muted-foreground">
                  The menu changes with the market. Ask what came in that morning.
                </p>
              ) : (
                <ul className="mt-6 flex flex-col divide-y divide-border border-y border-border">
                  {menu.map((dish) => (
                    <li key={dish.name} className="flex items-start justify-between gap-6 py-5">
                      <div className="min-w-0">
                        <h3 className="flex flex-wrap items-center gap-2 font-display text-lg">
                          {dish.name}
                          {meiteiAlias(dish.name, dish.meiteiName) && (
                            <span
                              lang="mni-Mtei"
                              className="font-mayek text-sm text-muted-foreground"
                            >
                              {meiteiAlias(dish.name, dish.meiteiName)}
                            </span>
                          )}
                          {dish.isVegetarian && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-success px-2 py-0.5 text-xs text-success">
                              <Leaf className="size-3" aria-hidden="true" />
                              Veg
                            </span>
                          )}
                          {dish.isSignature && <Badge variant="primary">Signature</Badge>}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {dish.description}
                        </p>
                      </div>
                      <p className="shrink-0 font-display text-lg">{formatINR(dish.price)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section
              aria-labelledby="visit-heading"
              className="rounded-[var(--radius-lg)] border border-border bg-surface-sunken p-6"
            >
              <h2 id="visit-heading" className="font-display text-2xl">
                Visiting
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="eyebrow text-muted-foreground">Timings</dt>
                  <dd className="mt-1.5 text-sm">{eatery.timings}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-muted-foreground">Phone</dt>
                  <dd className="mt-1.5 text-sm">
                    {eatery.phone ? (
                      <a
                        href={`tel:${eatery.phone}`}
                        className="inline-flex items-center gap-1.5 text-primary underline underline-offset-4"
                      >
                        <Phone className="size-4" aria-hidden="true" />
                        {eatery.phone}
                      </a>
                    ) : (
                      "Not listed"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-muted-foreground">Map</dt>
                  <dd className="mt-1.5 text-sm">
                    <a
                      href={mapsHref(eatery)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary underline underline-offset-4"
                    >
                      <MapPin className="size-4" aria-hidden="true" />
                      Open in Google Maps
                    </a>
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            {/* Only the fields the form reads cross into the client payload. */}
            <TableReservationForm
              eatery={{
                name: eatery.name,
                phone: eatery.phone,
                timings: eatery.timings,
                acceptsReservations: eatery.acceptsReservations,
              }}
            />
          </aside>
        </div>
      </div>
    </article>
  );
}
