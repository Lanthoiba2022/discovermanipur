import { Bike, Building2, Bus, Car, type LucideIcon, Route, Truck } from "lucide-react";

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
} from "@/components/cards/card-kit";
import { formatINR } from "@/lib/utils";
import type { TransportMode, TransportOption } from "@/types";

import { modeLabel } from "./transport-filters";

const MODE_ICON: Record<TransportMode, LucideIcon> = {
  cab: Car,
  suv: Car,
  tempo: Truck,
  bike: Bike,
  "shared-sumo": Truck,
  bus: Bus,
};

export function TransportCard({
  option,
  preload = false,
  className,
}: {
  option: TransportOption;
  preload?: boolean;
  className?: string;
}) {
  const ModeIcon = MODE_ICON[option.mode] ?? Car;
  const price = option.pricePerDay
    ? { value: formatINR(option.pricePerDay), unit: "/ day", label: "Price per day" }
    : option.pricePerKm
      ? { value: formatINR(option.pricePerKm), unit: "/ km", label: "Price per kilometre" }
      : null;

  return (
    <CardShell tone="stone" className={className}>
      <CardMedia
        image={option.images[0]}
        fallbackAlt={`A ${modeLabel(option.mode).toLowerCase()} run by ${option.operator} on a Manipur road`}
        sizes={CARD_SIZES.grid3}
        preload={preload}
      />

      <CardBody>
        <CardEyebrow icon={ModeIcon}>
          <span>{modeLabel(option.mode)}</span>
          <span aria-hidden="true" className="opacity-40">
            /
          </span>
          <span>
            {option.seats} {option.seats === 1 ? "seat" : "seats"}
          </span>
        </CardEyebrow>

        <CardTitle href={`/transport/${option.slug}`}>{option.name}</CardTitle>

        <CardLine icon={Building2}>Operated by {option.operator}</CardLine>
        <CardDescription>{option.description}</CardDescription>

        <CardMeta>
          {option.routes.length > 0 && (
            <CardFact icon={Route} label="Routes">
              {option.routes.slice(0, 2).join(" · ")}
              {option.routes.length > 2 ? ` +${option.routes.length - 2} more` : ""}
            </CardFact>
          )}
        </CardMeta>

        <CardFoot>
          {price ? (
            <CardPrice value={price.value} unit={price.unit} label={price.label} />
          ) : (
            <CardPrice value="Price on request" />
          )}
          <CardRating rating={option.rating} />
        </CardFoot>
      </CardBody>
    </CardShell>
  );
}
