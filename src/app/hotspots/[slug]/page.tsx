import {
  Accessibility,
  ArrowLeft,
  Banknote,
  CalendarRange,
  Clock,
  Hourglass,
  Lightbulb,
  MapPin,
  Navigation,
  Sun,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { meiteiAlias } from "@/lib/utils";
import { KanglaTeaser } from "@/components/immersive/kangla-teaser";
import { MapPanel } from "@/components/map/map-panel";
import { GalleryLightbox } from "@/components/places/gallery-lightbox";
import { HotspotCard } from "@/components/places/hotspot-card";
import { ParallaxHero } from "@/components/places/parallax-hero";
import {
  categoryLabel,
  formatDuration,
  formatKm,
  nearestHotspots,
  PLACEHOLDER_IMAGE,
  seasonLabel,
} from "@/components/places/taxonomy";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHotspotBySlug, getHotspots } from "@/lib/data";
import type { Hotspot } from "@/types";

type Params = Promise<{ slug: string }>;

/**
 * The catalogue is finite and fully enumerated by generateStaticParams, so a
 * slug outside that set does not exist. Without this, Next streams the page
 * (every detail route has a loading.tsx), flushing a 200 before notFound()
 * throws — a soft 404 that would let crawlers index any garbage URL.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  const rows = await getHotspots();
  return rows.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const hotspot = await getHotspotBySlug(slug);

  if (!hotspot) {
    return {
      title: "Place not found",
      description: "This Manipur destination is not on Manipur Tourism yet.",
    };
  }

  const image = hotspot.images[0]?.src ?? PLACEHOLDER_IMAGE;
  const description = `${hotspot.tagline} ${hotspot.description}`.slice(0, 180).trim();

  return {
    title: hotspot.name,
    description,
    openGraph: {
      title: `${hotspot.name} · ${hotspot.district}, Manipur`,
      description,
      type: "article",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: hotspot.images[0]?.alt ?? `${hotspot.name}, Manipur`,
        },
      ],
    },
  };
}

export default async function HotspotDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const hotspot = await getHotspotBySlug(slug);
  if (!hotspot) notFound();

  const all = await getHotspots();
  const nearby = nearestHotspots(hotspot, all, 4);
  const cover = hotspot.images[0];
  const gallery = hotspot.images.slice(1);

  return (
    <main id="main">
      <ParallaxHero
        src={cover?.src ?? PLACEHOLDER_IMAGE}
        alt={cover?.alt ?? `${hotspot.name} in ${hotspot.district}, Manipur`}
      >
        <Link
          href="/hotspots"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-cream-200 transition-colors hover:text-cream-50"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All places
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="glass" className="uppercase tracking-[0.16em]">
            {categoryLabel(hotspot.category)}
          </Badge>
          <Badge variant="glass">
            <MapPin className="size-3" aria-hidden />
            {hotspot.district}
          </Badge>
          {hotspot.accessibility?.wheelchairAccessible && (
            <Badge variant="glass">
              <Accessibility className="size-3" aria-hidden />
              Step-free access
            </Badge>
          )}
        </div>

        <h1 className="text-display mt-5 max-w-4xl text-cream-50">{hotspot.name}</h1>
        {meiteiAlias(hotspot.name, hotspot.meiteiName) && (
          <p className="font-mayek mt-3 text-2xl text-accent md:text-3xl" lang="mni-Mtei">
            {meiteiAlias(hotspot.name, hotspot.meiteiName)}
          </p>
        )}
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-cream-200">
          {hotspot.tagline}
        </p>
      </ParallaxHero>

      <div className="shell grid gap-12 py-16 lg:grid-cols-[1fr_20rem] lg:gap-16 md:py-20">
        {/* ------------------------------------------------------------- body */}
        <article className="min-w-0 max-w-3xl">
          <Reveal>
            <h2 className="text-headline">About this place</h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {hotspot.description}
            </p>
          </Reveal>

          {hotspot.slug === "kangla-fort" && <KanglaTeaser compact />}

          {hotspot.history && (
            <Reveal className="mt-14">
              <h2 className="font-display text-3xl">The history</h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">{hotspot.history}</p>
            </Reveal>
          )}

          {hotspot.howToReach && (
            <Reveal className="mt-14">
              <h2 className="font-display text-3xl">How to reach</h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">{hotspot.howToReach}</p>
            </Reveal>
          )}

          {hotspot.tips?.length > 0 && (
            <Reveal className="mt-14">
              <h2 className="font-display text-3xl">Local tips</h2>
              <ul className="mt-6 space-y-4">
                {hotspot.tips.map((tip) => (
                  <li key={tip} className="flex gap-3 text-sm leading-relaxed">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          <Reveal className="mt-14">
            <h2 className="font-display text-3xl">Gallery</h2>
            <GalleryLightbox
              images={gallery.length > 0 ? gallery : hotspot.images}
              title={hotspot.name}
              className="mt-6"
            />
          </Reveal>

          {hotspot.coordinates && (
            <Reveal className="mt-14">
              <h2 className="font-display text-3xl">On the map</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {hotspot.location} · {hotspot.coordinates.lat.toFixed(4)}°N,{" "}
                {hotspot.coordinates.lng.toFixed(4)}°E
              </p>
              <MapPanel
                className="mt-6 h-[22rem]"
                zoom={12}
                ariaLabel={`Map showing the location of ${hotspot.name}`}
                points={[
                  {
                    slug: hotspot.slug,
                    name: hotspot.name,
                    subtitle: hotspot.location,
                    category: categoryLabel(hotspot.category),
                    image: cover?.src,
                    lat: hotspot.coordinates.lat,
                    lng: hotspot.coordinates.lng,
                  },
                ]}
              />
            </Reveal>
          )}
        </article>

        {/* ------------------------------------------------------ quick facts */}
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-sm)]">
            <h2 className="eyebrow mb-5 text-muted-foreground">Quick facts</h2>
            <dl className="space-y-5 text-sm">
              <Fact icon={CalendarRange} label="Best time to visit" value={hotspot.bestTimeToVisit} />
              <Fact
                icon={Sun}
                label="Best seasons"
                value={
                  hotspot.bestSeasons?.length
                    ? hotspot.bestSeasons.map(seasonLabel).join(" · ")
                    : "Year-round"
                }
              />
              <Fact icon={Banknote} label="Entry fee" value={hotspot.entryFee} />
              <Fact icon={Clock} label="Timings" value={hotspot.timings} />
              <Fact
                icon={Navigation}
                label="From Imphal"
                value={formatKm(hotspot.distanceFromImphalKm)}
              />
              <Fact
                icon={Hourglass}
                label="Time needed"
                value={formatDuration(hotspot.durationHours)}
              />
              <Fact
                icon={Accessibility}
                label="Accessibility"
                value={
                  hotspot.accessibility?.notes ||
                  (hotspot.accessibility?.wheelchairAccessible
                    ? "Wheelchair accessible"
                    : "Not step-free")
                }
              />
            </dl>

            <Button asChild variant="primary" size="pill" className="mt-7 w-full">
              <Link href="/plan">Plan a trip around this</Link>
            </Button>
          </div>
        </aside>
      </div>

      {/* -------------------------------------------------------- nearby */}
      {nearby.length > 0 && (
        <section className="border-t border-border bg-surface-sunken py-16 md:py-24">
          <div className="shell">
            <h2 className="text-headline">Nearby places</h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Within an easy detour of {hotspot.name}.
            </p>
            <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {nearby.map(({ hotspot: near, km }, index) => (
                <Reveal as="li" key={near.slug} delayIndex={index}>
                  <NearbyCard hotspot={near} km={km} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
        <dd className="mt-1 leading-snug">{value}</dd>
      </div>
    </div>
  );
}

function NearbyCard({ hotspot, km }: { hotspot: Hotspot; km: number }) {
  return (
    <div className="relative h-full">
      <HotspotCard hotspot={hotspot} className="h-full" />
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
        {formatKm(km)} away
      </span>
    </div>
  );
}
