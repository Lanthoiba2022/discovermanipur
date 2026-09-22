import { ArrowLeft, CalendarDays, MapPin, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { meiteiAlias } from "@/lib/utils";
import { GalleryLightbox } from "@/components/places/gallery-lightbox";
import { HotspotCard } from "@/components/places/hotspot-card";
import { ParallaxHero } from "@/components/places/parallax-hero";
import { PLACEHOLDER_IMAGE } from "@/components/places/taxonomy";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFestivalBySlug, getFestivals, getHotspots } from "@/lib/data";

type Params = Promise<{ slug: string }>;

/**
 * The catalogue is finite and fully enumerated by generateStaticParams, so a
 * slug outside that set does not exist. Without this, Next streams the page
 * (every detail route has a loading.tsx), flushing a 200 before notFound()
 * throws — a soft 404 that would let crawlers index any garbage URL.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  const rows = await getFestivals();
  return rows.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const festival = await getFestivalBySlug(slug);

  if (!festival) {
    return {
      title: "Festival not found",
      description: "This Manipur festival is not on Manipur Tourism yet.",
    };
  }

  const description = festival.description.slice(0, 180).trim();

  return {
    title: `${festival.name} — ${festival.month} in Manipur`,
    description,
    openGraph: {
      title: `${festival.name} · ${festival.district}, Manipur`,
      description,
      type: "article",
      images: [
        {
          url: festival.images[0]?.src ?? PLACEHOLDER_IMAGE,
          width: 1200,
          height: 630,
          alt: festival.images[0]?.alt ?? `${festival.name} in Manipur`,
        },
      ],
    },
  };
}

export default async function FestivalDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const festival = await getFestivalBySlug(slug);
  if (!festival) notFound();

  const allHotspots = await getHotspots();
  const related = allHotspots.filter((h) => h.district === festival.district).slice(0, 4);
  const cover = festival.images[0];
  const gallery = festival.images.slice(1);

  return (
    <main id="main">
      <ParallaxHero
        src={cover?.src ?? PLACEHOLDER_IMAGE}
        alt={cover?.alt ?? `${festival.name} being celebrated in ${festival.district}, Manipur`}
        heightClassName="min-h-[64vh] md:min-h-[74vh]"
      >
        <Link
          href="/festivals"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-cream-200 transition-colors hover:text-cream-50"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Festival calendar
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="glass">
            <CalendarDays className="size-3" aria-hidden />
            {festival.typicalDates || festival.month}
          </Badge>
          <Badge variant="glass">
            <MapPin className="size-3" aria-hidden />
            {festival.district}
          </Badge>
        </div>

        <h1 className="text-display mt-5 max-w-4xl text-cream-50">{festival.name}</h1>
        {meiteiAlias(festival.name, festival.meiteiName) && (
          <p className="font-mayek mt-3 text-2xl text-accent md:text-3xl" lang="mni-Mtei">
            {meiteiAlias(festival.name, festival.meiteiName)}
          </p>
        )}
      </ParallaxHero>

      <div className="shell grid gap-12 py-16 lg:grid-cols-[1fr_18rem] lg:gap-16 md:py-20">
        <article className="min-w-0 max-w-3xl">
          <Reveal>
            <h2 className="text-headline">What happens</h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {festival.description}
            </p>
          </Reveal>

          {festival.significance && (
            <Reveal className="mt-14">
              <h2 className="font-display text-3xl">Why it matters</h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                {festival.significance}
              </p>
            </Reveal>
          )}

          <Reveal className="mt-14">
            <h2 className="font-display text-3xl">Gallery</h2>
            <GalleryLightbox
              images={gallery.length > 0 ? gallery : festival.images}
              title={festival.name}
              className="mt-6"
            />
          </Reveal>
        </article>

        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-sm)]">
            <h2 className="eyebrow mb-5 text-muted-foreground">When &amp; where</h2>
            <dl className="space-y-5 text-sm">
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    Typical dates
                  </dt>
                  <dd className="mt-1 leading-snug">
                    {festival.typicalDates || festival.month}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    Where
                  </dt>
                  <dd className="mt-1 leading-snug">
                    {festival.location || festival.district}
                    <span className="block text-muted-foreground">{festival.district}</span>
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    Month
                  </dt>
                  <dd className="mt-1 leading-snug">{festival.month}</dd>
                </div>
              </div>
            </dl>

            <Button asChild variant="primary" size="pill" className="mt-7 w-full">
              <Link href="/plan">Build a trip around it</Link>
            </Button>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="border-t border-border bg-surface-sunken py-16 md:py-24">
          <div className="shell">
            <h2 className="text-headline">While you are in {festival.district}</h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Places worth pairing with {festival.name}.
            </p>
            <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {related.map((hotspot, index) => (
                <Reveal as="li" key={hotspot.slug} delayIndex={index}>
                  <HotspotCard hotspot={hotspot} className="h-full" />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
