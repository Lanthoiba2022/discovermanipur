import {
  Clock,
  Hammer,
  Languages,
  Leaf,
  type LucideIcon,
  MapPin,
  Music,
  PawPrint,
  Scissors,
  Sparkles,
  Soup,
  Users,
  Wheat,
} from "lucide-react";

import {
  CARD_SIZES,
  CardBody,
  CardDescription,
  CardEyebrow,
  CardFact,
  CardFoot,
  CardLine,
  CardMedia,
  CardMeta,
  CardPrice,
  CardRating,
  CardShell,
  CardTitle,
  MediaChip,
} from "@/components/cards/card-kit";
import { titleCase } from "@/components/filters";
import { formatINR } from "@/lib/utils";
import type { Experience, ExperienceCategory } from "@/types";

import { formatHours } from "./experience-filters";

const CATEGORY_ICON: Record<ExperienceCategory, LucideIcon> = {
  craft: Hammer,
  cuisine: Soup,
  festival: Sparkles,
  adventure: Users,
  wellness: Leaf,
  music: Music,
  textile: Scissors,
  agriculture: Wheat,
  wildlife: PawPrint,
};

export function ExperienceCard({
  experience,
  preload = false,
  className,
}: {
  experience: Experience;
  preload?: boolean;
  className?: string;
}) {
  const Icon = CATEGORY_ICON[experience.category] ?? Sparkles;

  return (
    <CardShell tone="terracotta" className={className}>
      <CardMedia
        image={experience.images[0]}
        fallbackAlt={`Guests taking part in ${experience.title} with ${experience.host} at ${experience.location}, Manipur`}
        sizes={CARD_SIZES.grid3}
        preload={preload}
        status={experience.featured ? <MediaChip icon={Sparkles}>Editors&rsquo; pick</MediaChip> : null}
      />

      <CardBody>
        <CardEyebrow icon={Icon}>
          <span>{titleCase(experience.category)}</span>
          <span aria-hidden="true" className="opacity-40">
            /
          </span>
          <span>{experience.district}</span>
        </CardEyebrow>

        <CardTitle href={`/experiences/${experience.slug}`}>{experience.title}</CardTitle>

        <CardLine icon={MapPin}>
          {experience.location} · hosted by {experience.host}
        </CardLine>
        <CardDescription>{experience.description}</CardDescription>

        <CardMeta>
          <CardFact icon={Clock} label="Duration">
            {formatHours(experience.durationHours)}
          </CardFact>
          <CardFact icon={Users} label="Maximum group size">
            Up to {experience.groupSizeMax}
          </CardFact>
          {experience.languages.length > 0 && (
            <CardFact icon={Languages} label="Run in">
              {experience.languages.slice(0, 2).join(" · ")}
            </CardFact>
          )}
        </CardMeta>

        <CardFoot>
          <CardPrice
            value={formatINR(experience.pricePerPerson)}
            unit="/ person"
            label="Price per person"
          />
          <CardRating rating={experience.rating} count={experience.reviewCount} />
        </CardFoot>
      </CardBody>
    </CardShell>
  );
}
