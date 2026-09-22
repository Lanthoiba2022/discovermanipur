import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, Languages, MapPin, Star, Users } from "lucide-react";

import { ExperienceBookingPanel } from "@/components/experiences/booking-panel";
import { formatHours } from "@/components/experiences/experience-filters";
import { MediaGallery } from "@/components/shared/media-gallery";
import { Badge } from "@/components/ui/badge";
import { getExperienceBySlug, getExperiences } from "@/lib/data";

type Params = { slug: string };

/**
 * The catalogue is finite and fully enumerated by generateStaticParams, so a
 * slug outside that set does not exist. Without this, Next streams the page
 * (every detail route has a loading.tsx), flushing a 200 before notFound()
 * throws — a soft 404 that would let crawlers index any garbage URL.
 */
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  const rows = await getExperiences();
  return rows.map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const experience = await getExperienceBySlug(slug);
  if (!experience) return { title: "Experience not found" };

  return {
    title: experience.title,
    description: experience.description.slice(0, 160),
    openGraph: {
      title: experience.title,
      description: experience.description.slice(0, 160),
      images: experience.images[0] ? [{ url: experience.images[0].src }] : undefined,
    },
  };
}

export default async function ExperienceDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const experience = await getExperienceBySlug(slug);
  if (!experience) notFound();

  return (
    <article className="pb-24">
      <div className="shell pt-28 md:pt-32">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/experiences" className="hover:text-foreground">
            Experiences
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-foreground">{experience.title}</span>
        </nav>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Badge variant="accent" className="capitalize">
            {experience.category}
          </Badge>
          {experience.featured && <Badge variant="primary">Editor&rsquo;s pick</Badge>}
        </div>

        <h1 className="text-headline mt-4 max-w-4xl">{experience.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden="true" />
            {experience.location}, {experience.district}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden="true" />
            {formatHours(experience.durationHours)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-4" aria-hidden="true" />
            Up to {experience.groupSizeMax} guests
          </span>
          {experience.rating > 0 && (
            <span className="flex items-center gap-1.5">
              <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
              {experience.rating.toFixed(1)} · {experience.reviewCount} reviews
            </span>
          )}
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-12">
            <MediaGallery images={experience.images} title={experience.title} />

            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="font-display text-2xl">
                About this experience
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {experience.description}
              </p>
            </section>

            {experience.includes.length > 0 && (
              <section aria-labelledby="includes-heading">
                <h2 id="includes-heading" className="font-display text-2xl">
                  What&rsquo;s included
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {experience.includes.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section
              aria-labelledby="host-heading"
              className="rounded-[var(--radius-lg)] border border-border bg-surface-sunken p-6"
            >
              <h2 id="host-heading" className="font-display text-2xl">
                Your host
              </h2>
              <p className="mt-3 text-lg">{experience.host}</p>
              <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="eyebrow text-muted-foreground">Languages</dt>
                  <dd className="mt-1.5 flex items-center gap-2 text-sm">
                    <Languages className="size-4 text-muted-foreground" aria-hidden="true" />
                    {experience.languages.length > 0
                      ? experience.languages.join(", ")
                      : "Ask the host"}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-muted-foreground">Duration</dt>
                  <dd className="mt-1.5 text-sm">{formatHours(experience.durationHours)}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-muted-foreground">Group size</dt>
                  <dd className="mt-1.5 text-sm">Up to {experience.groupSizeMax} guests</dd>
                </div>
              </dl>
            </section>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <ExperienceBookingPanel experience={experience} />
          </aside>
        </div>
      </div>
    </article>
  );
}
