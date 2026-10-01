import {
  Clock,
  Compass,
  Drum,
  HeartPulse,
  Leaf,
  MapPin,
  Palette,
  PartyPopper,
  Shirt,
  Star,
  Users,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { BandRail } from "@/components/landing/band-rail";
import { ShowcaseBand } from "@/components/landing/showcase-band";
import { formatINR } from "@/lib/utils";
import type { Experience, ExperienceCategory } from "@/types";

import {
  BandEmpty,
  BandPill,
  CardChip,
  CardMedia,
  CardMeta,
  RAIL_ITEM,
} from "./showcase-card";

/**
 * The second band, and deliberately the quietest of the four.
 *
 * After a full-bleed photograph the page needs to exhale, so this one is set
 * on the sand ground with the masthead centred and the cards built the other
 * way round from the destinations rail: photograph on top, copy below on a
 * white card. Same rhythm, opposite construction, which is what stops the
 * sequence reading as one component repeated with different nouns.
 */

const CATEGORY: Record<ExperienceCategory, { label: string; icon: LucideIcon }> = {
  craft: { label: "Craft", icon: Palette },
  cuisine: { label: "Cuisine", icon: Utensils },
  festival: { label: "Festival", icon: PartyPopper },
  adventure: { label: "Adventure", icon: Compass },
  wellness: { label: "Wellness", icon: HeartPulse },
  music: { label: "Music", icon: Drum },
  textile: { label: "Textile", icon: Shirt },
  agriculture: { label: "Farming", icon: Leaf },
  wildlife: { label: "Wildlife", icon: Leaf },
};

function hoursLabel(hours: number) {
  if (hours >= 24) {
    const days = Math.round(hours / 24);
    return days === 1 ? "Full day" : `${days} days`;
  }
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (whole === 0) return `${minutes} min`;
  return minutes === 0 ? `${whole} hr` : `${whole} hr ${minutes} min`;
}

function ExperienceCard({ experience }: { experience: Experience }) {
  const category = CATEGORY[experience.category];

  return (
    <li className={RAIL_ITEM}>
      <Link
        href={`/experiences/${experience.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface transition-[transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-flat)] hover:-translate-y-1 hover:shadow-[var(--shadow-md)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <CardMedia
          shape="landscape"
          className="rounded-none"
          image={experience.images[0]}
          fallbackAlt={`A session under way at ${experience.location}, ${experience.district} district`}
        />

        <div className="flex flex-1 flex-col p-5">
          <div className="flex min-h-8 flex-wrap items-center gap-2">
            <CardChip icon={category.icon}>{category.label}</CardChip>
            <CardMeta icon={Clock} className="text-muted-foreground">
              {hoursLabel(experience.durationHours)}
            </CardMeta>
          </div>

          {/* Titles wrap in full. Only the host line below is allowed to clip. */}
          <h3 className="mt-3 text-title text-foreground">{experience.title}</h3>

          {/* A host is a person's name, so it wraps in full like the title. */}
          <p className="mt-2 text-sm text-pine-600">With {experience.host}</p>

          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin aria-hidden className="mt-1 size-3.5 shrink-0" />
            <span>
              {experience.location}, {experience.district}
            </span>
          </p>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-t border-border pt-4">
            <p className="text-foreground">
              {/* A price is written for a reader, not issued by a machine, so
                  it stays in the body face. */}
              <span className="text-lg font-semibold">
                {formatINR(experience.pricePerPerson)}
              </span>
              <span className="text-sm text-muted-foreground"> per person</span>
            </p>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {experience.reviewCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Star aria-hidden className="size-3.5 shrink-0 fill-brass-500 text-brass-500" />
                  <span className="text-foreground">{experience.rating.toFixed(1)}</span>
                  <span className="sr-only">
                    out of 5, from {experience.reviewCount} reviews
                  </span>
                  <span aria-hidden>({experience.reviewCount})</span>
                </span>
              )}
              <CardMeta icon={Users}>
                <span className="sr-only">Maximum group size </span>
                {experience.groupSizeMax}
              </CardMeta>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

export function ExperiencesBand({ experiences }: { experiences: Experience[] }) {
  return (
    <ShowcaseBand
      id="experiences"
      tone="sand"
      align="center"
      eyebrow="Hosted by Manipuris"
      word="Experiences"
      tail="you join rather than watch: a loom, a kitchen, a canoe at dawn."
      ghost="ꯑ"
      action={<BandPill href="/experiences">All experiences</BandPill>}
    >
      {experiences.length > 0 ? (
        <BandRail label="Featured experiences">
          {experiences.map((experience) => (
            <ExperienceCard key={experience.slug} experience={experience} />
          ))}
        </BandRail>
      ) : (
        <BandEmpty
          title="Hosts are being introduced"
          body="Weavers, potters, cooks and paddlers are joining a few at a time, and featured sessions will appear here as they open their doors."
          href="/experiences"
          cta="Browse every experience"
        />
      )}
    </ShowcaseBand>
  );
}
