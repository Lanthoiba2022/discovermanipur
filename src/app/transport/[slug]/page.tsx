import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Route, Star, Users } from "lucide-react";

import { MediaGallery } from "@/components/shared/media-gallery";
import { TransportEnquiryForm } from "@/components/transport/transport-enquiry-form";
import { modeLabel } from "@/components/transport/transport-filters";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import { getTransportBySlug, getTransportOptions } from "@/lib/data";

type Params = { slug: string };

/**
 * The catalogue is finite and fully enumerated by generateStaticParams, so a
 * slug outside that set does not exist. Without this, Next streams the page
 * (every detail route has a loading.tsx), flushing a 200 before notFound()
 * throws — a soft 404 that would let crawlers index any garbage URL.
 */
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  const rows = await getTransportOptions();
  return rows.map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const option = await getTransportBySlug(slug);
  if (!option) return { title: "Transport option not found" };

  return {
    title: `${option.name} · ${modeLabel(option.mode)} hire`,
    description: option.description.slice(0, 160),
    openGraph: {
      title: option.name,
      description: option.description.slice(0, 160),
      images: option.images[0] ? [{ url: option.images[0].src }] : undefined,
    },
  };
}

export default async function TransportDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const option = await getTransportBySlug(slug);
  if (!option) notFound();

  return (
    <article className="pb-24">
      <div className="shell pt-28 md:pt-32">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/transport" className="hover:text-foreground">
            Transport
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-foreground">{option.name}</span>
        </nav>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Badge variant="accent">{modeLabel(option.mode)}</Badge>
          {option.featured && <Badge variant="primary">Editor&rsquo;s pick</Badge>}
        </div>

        <h1 className="text-headline mt-4 max-w-4xl">{option.name}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span>Operated by {option.operator}</span>
          <span className="flex items-center gap-1.5">
            <Users className="size-4" aria-hidden="true" />
            {option.seats} {option.seats === 1 ? "seat" : "seats"}
          </span>
          {option.rating > 0 && (
            <span className="flex items-center gap-1.5">
              <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
              {option.rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-12">
            <MediaGallery images={option.images} title={option.name} />

            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="font-display text-2xl">
                About this vehicle
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {option.description}
              </p>
            </section>

            <section aria-labelledby="pricing-heading">
              <h2 id="pricing-heading" className="font-display text-2xl">
                Pricing
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
                  <dt className="eyebrow text-muted-foreground">Per day</dt>
                  <dd className="mt-2 font-display text-2xl">
                    {option.pricePerDay ? formatINR(option.pricePerDay) : "On request"}
                  </dd>
                </div>
                <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
                  <dt className="eyebrow text-muted-foreground">Per km</dt>
                  <dd className="mt-2 font-display text-2xl">
                    {option.pricePerKm ? formatINR(option.pricePerKm) : "On request"}
                  </dd>
                </div>
                <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
                  <dt className="eyebrow text-muted-foreground">Capacity</dt>
                  <dd className="mt-2 font-display text-2xl">{option.seats} seats</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-muted-foreground">
                Hill routes often carry a surcharge for fuel and the driver&rsquo;s night halt. Ask
                the operator to confirm before you set out.
              </p>
            </section>

            {option.routes.length > 0 && (
              <section aria-labelledby="routes-heading">
                <h2 id="routes-heading" className="font-display text-2xl">
                  Routes covered
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {option.routes.map((route) => (
                    <li key={route}>
                      <Badge variant="outline">
                        <Route className="size-3.5" aria-hidden="true" />
                        {route}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {option.includes.length > 0 && (
              <section aria-labelledby="includes-heading">
                <h2 id="includes-heading" className="font-display text-2xl">
                  What&rsquo;s included
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {option.includes.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <TransportEnquiryForm option={option} />
          </aside>
        </div>
      </div>
    </article>
  );
}
