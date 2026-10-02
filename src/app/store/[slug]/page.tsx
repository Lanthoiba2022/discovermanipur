import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Award, Hammer, Info, MapPin } from "lucide-react";

import { IntentLink } from "@/components/shared/intent-link";
import { meiteiAlias } from "@/lib/utils";
import { MediaGallery } from "@/components/shared/media-gallery";
import { CraftCard } from "@/components/store/craft-card";
import {
  craftCategoryLabel,
  formatLeadTime,
  relatedCrafts,
} from "@/components/store/craft-filters";
import { MakerCard } from "@/components/store/maker-card";
import { Badge } from "@/components/ui/badge";
import { getCraftBySlug, getCrafts } from "@/lib/data";
import { ogImagesFor } from "@/lib/seo/og";

type Params = { slug: string };

/**
 * The catalogue is finite and fully enumerated below, so anything outside it
 * genuinely does not exist. Without this, the streamed response (there is a
 * loading.tsx) would flush a 200 before notFound() throws: a soft 404.
 */
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  const rows = await getCrafts();
  return rows.map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const craft = await getCraftBySlug(slug);
  if (!craft) return { title: "Craft not found" };

  const description = `${craft.description.slice(0, 140)} Made by ${craft.maker} in ${craft.location}. Enquire with the maker directly. Discover Manipur takes no commission.`;

  return {
    title: `${craft.name} by ${craft.maker}`,
    description: description.slice(0, 200),
    openGraph: {
      title: `${craft.name} · ${craft.maker}`,
      description: description.slice(0, 200),
      // 1200 px optimizer variant of a self-hosted photo, else the site card.
      images: ogImagesFor(craft.images[0]),
    },
  };
}

export default async function CraftDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const craft = await getCraftBySlug(slug);
  if (!craft) notFound();

  const all = await getCrafts();
  const related = relatedCrafts(all, craft);

  return (
    <article className="pb-24">
      <div className="shell pt-28 md:pt-32">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <IntentLink href="/store" className="hover:text-foreground">
            Crafts
          </IntentLink>
          <span aria-hidden="true"> / </span>
          <span className="text-foreground">{craft.name}</span>
        </nav>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Badge variant="accent">{craftCategoryLabel(craft.category)}</Badge>
          {craft.giTagged && (
            <Badge variant="primary">
              <Award className="size-3.5" aria-hidden="true" />
              GI tagged
            </Badge>
          )}
          {craft.madeToOrder && (
            <Badge variant="outline">
              <Hammer className="size-3.5" aria-hidden="true" />
              Made to order
              {craft.leadTimeDays ? ` · ${formatLeadTime(craft.leadTimeDays)}` : ""}
            </Badge>
          )}
        </div>

        <h1 className="text-headline mt-4 max-w-4xl">{craft.name}</h1>
        {meiteiAlias(craft.name, craft.meiteiName) && (
          <p className="font-mayek mt-3 text-2xl text-muted-foreground" lang="mni-Beng">
            {meiteiAlias(craft.name, craft.meiteiName)}
          </p>
        )}

        <p className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {craft.location}, {craft.district}
          </span>
          <span>
            Made by <span className="text-foreground">{craft.maker}</span>
          </span>
        </p>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-12">
            <MediaGallery images={craft.images} title={craft.name} />

            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="font-display text-2xl">
                About this piece
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {craft.description}
              </p>
            </section>

            {craft.story && (
              <section
                aria-labelledby="story-heading"
                className="rounded-[var(--radius-lg)] border-l-4 border-primary bg-surface-sunken p-6 md:p-8"
              >
                <p className="eyebrow text-muted-foreground">The tradition</p>
                <h2 id="story-heading" className="font-display mt-2 text-2xl leading-tight">
                  How it is made, and why it looks like this
                </h2>
                <p className="mt-5 text-lg leading-relaxed">{craft.story}</p>
              </section>
            )}

            <section aria-labelledby="details-heading">
              <h2 id="details-heading" className="font-display text-2xl">
                Materials and making
              </h2>
              <dl className="mt-5 grid gap-6 sm:grid-cols-3">
                <div>
                  <dt className="eyebrow text-muted-foreground">Materials</dt>
                  <dd className="mt-1.5 text-sm">
                    {craft.materials.length > 0
                      ? craft.materials.join(", ")
                      : "Ask the maker"}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-muted-foreground">Availability</dt>
                  <dd className="mt-1.5 text-sm">
                    {craft.madeToOrder ? "Made to order" : "Made in small batches"}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-muted-foreground">Lead time</dt>
                  <dd className="mt-1.5 text-sm">
                    {craft.madeToOrder && craft.leadTimeDays
                      ? formatLeadTime(craft.leadTimeDays)
                      : "Agreed with the maker"}
                  </dd>
                </div>
              </dl>
            </section>

            <p className="flex items-start gap-2 rounded-[var(--radius)] border border-dashed border-border-strong p-4 text-sm leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Maker phone numbers and websites are placeholders until each maker&apos;s real details are verified. Discover Manipur never
              holds your money: you agree the price and the delivery with the maker yourself.
            </p>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <MakerCard craft={craft} />
          </aside>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-20 border-t border-border pt-14">
            <h2 id="related-heading" className="font-display text-2xl">
              More from the same tradition
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((row) => (
                <li key={row.id} className="flex">
                  <CraftCard craft={row} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
