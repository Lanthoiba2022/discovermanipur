/**
 * A compact digest of the Discover Manipur catalogue, handed to the model as grounding
 * for /api/itinerary. Titles and hrefs come straight from the data layer, so a
 * plan can only ever reference listings that really exist.
 */

import { getEateries, getExperiences, getFestivals, getHomestays, getHotspots } from "@/lib/data";

function line(parts: Array<string | number | undefined>): string {
  return parts.filter(Boolean).join(" · ");
}

export async function catalogueDigest(limitPerKind = 24): Promise<string> {
  const [places, stays, experiences, eateries, festivals] = await Promise.all([
    getHotspots({ limit: limitPerKind }),
    getHomestays({ limit: limitPerKind, sort: "price-asc" }),
    getExperiences({ limit: limitPerKind }),
    getEateries({ limit: limitPerKind }),
    getFestivals({ limit: limitPerKind }),
  ]);

  const sections: string[] = [];

  if (places.length) {
    sections.push(
      `### Places (kind: place)\n${places
        .map((p) =>
          line([
            p.name,
            `/hotspots/${p.slug}`,
            p.category,
            p.district,
            `${p.durationHours}h`,
            `${p.distanceFromImphalKm}km from Imphal`,
            p.accessibility.wheelchairAccessible ? "step-free" : undefined,
            p.tagline,
          ]),
        )
        .join("\n")}`,
    );
  }

  if (stays.length) {
    sections.push(
      `### Homestays (kind: stay)\n${stays
        .map((s) => line([s.title, `/homestays/${s.slug}`, s.location, `₹${s.pricePerNight}/night`, `sleeps ${s.maxGuests}`]))
        .join("\n")}`,
    );
  }

  if (experiences.length) {
    sections.push(
      `### Experiences (kind: experience)\n${experiences
        .map((e) => line([e.title, `/experiences/${e.slug}`, e.category, e.location, `${e.durationHours}h`, `₹${e.pricePerPerson}/person`]))
        .join("\n")}`,
    );
  }

  if (eateries.length) {
    sections.push(
      `### Eateries (kind: eatery)\n${eateries
        .map((e) => line([e.name, `/eateries/${e.slug}`, e.cuisines.join("/"), e.location, "₹".repeat(e.priceRange), e.timings]))
        .join("\n")}`,
    );
  }

  if (festivals.length) {
    sections.push(
      `### Festivals (kind: festival)\n${festivals
        .map((f) => line([f.name, `/festivals/${f.slug}`, f.month, f.typicalDates, f.location]))
        .join("\n")}`,
    );
  }

  if (sections.length === 0) {
    return "The catalogue is currently empty. Produce a plan whose days say so honestly and contain no invented listings.";
  }

  return sections.join("\n\n");
}
