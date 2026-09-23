import {
  Award,
  Drum,
  Gem,
  Hammer,
  Leaf,
  type LucideIcon,
  MapPin,
  Package,
  Palette,
  Handshake,
  Shirt,
  Wheat,
} from "lucide-react";

import {
  CARD_SIZES,
  CardAlias,
  CardBody,
  CardDescription,
  CardEyebrow,
  CardFact,
  CardFoot,
  CardLine,
  CardMedia,
  CardMeta,
  CardPrice,
  CardShell,
  CardTitle,
  MediaChip,
} from "@/components/cards/card-kit";
import { formatINR, meiteiAlias } from "@/lib/utils";
import type { Craft, CraftCategory } from "@/types";

import { craftCategoryLabel, formatLeadTime } from "./craft-filters";

const CATEGORY_ICON: Record<CraftCategory, LucideIcon> = {
  handloom: Shirt,
  pottery: Palette,
  bamboo: Leaf,
  jewellery: Gem,
  sculpture: Hammer,
  "food-produce": Wheat,
  instrument: Drum,
};

export function CraftCard({
  craft,
  preload = false,
  className,
}: {
  craft: Craft;
  preload?: boolean;
  className?: string;
}) {
  const alias = meiteiAlias(craft.name, craft.meiteiName);
  const Icon = CATEGORY_ICON[craft.category] ?? Package;

  return (
    <CardShell tone="terracotta" className={className}>
      <CardMedia
        image={craft.images[0]}
        fallbackAlt={`${craft.name}, ${craft.materials.slice(0, 2).join(" and ")} work made by ${craft.maker} in ${craft.location}, Manipur`}
        sizes={CARD_SIZES.grid3}
        preload={preload}
        status={craft.giTagged ? <MediaChip icon={Award}>GI tagged</MediaChip> : null}
      />

      <CardBody>
        <CardEyebrow icon={Icon}>
          <span>{craftCategoryLabel(craft.category)}</span>
          <span aria-hidden="true" className="opacity-40">
            /
          </span>
          <span>{craft.district}</span>
        </CardEyebrow>

        <CardTitle href={`/store/${craft.slug}`}>{craft.name}</CardTitle>
        {alias && <CardAlias>{alias}</CardAlias>}

        <CardLine icon={MapPin}>
          {craft.maker} · {craft.location}, {craft.district}
        </CardLine>
        <CardDescription>{craft.description}</CardDescription>

        <CardMeta>
          {craft.madeToOrder ? (
            <CardFact icon={Hammer} label="Availability">
              Made to order
              {craft.leadTimeDays ? ` · ready in ${formatLeadTime(craft.leadTimeDays)}` : ""}
            </CardFact>
          ) : (
            <CardFact icon={Handshake} label="Availability">
              Ready to collect
            </CardFact>
          )}
          <CardFact icon={Package} label="Made from">
            {craft.materials.slice(0, 3).join(" · ")}
          </CardFact>
        </CardMeta>

        <CardFoot>
          <CardPrice
            value={formatINR(craft.price)}
            unit={craft.priceNote}
            label={`Price of ${craft.name}`}
          />
        </CardFoot>
      </CardBody>
    </CardShell>
  );
}
