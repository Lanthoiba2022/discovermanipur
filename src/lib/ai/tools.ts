/**
 * The concierge's toolbelt.
 *
 * Every tool is backed by `@/lib/data`: the concierge can only ever recommend
 * things that actually exist in the Discover Manipur catalogue. Results are deliberately
 * compact (title, slug, href, one-line summary, price) rather than whole
 * records: it keeps the context small and gives the UI a clean card shape.
 *
 * The catalogue may legitimately be empty (it is seeded in parallel). Every
 * tool therefore returns a `note` instead of throwing when nothing matches.
 */

import { tool } from "ai";
import { z } from "zod";

import {
  getEateries,
  getEateryBySlug,
  getExperiences,
  getExperienceBySlug,
  getFestivals,
  getHomestays,
  getHomestayBySlug,
  getHotspots,
  getTours,
  getTourBySlug,
  getTransportBySlug,
  getTransportOptions,
} from "@/lib/data";
import { formatINR, nightsBetween } from "@/lib/utils";
import { quoteExperience, quoteStay, quoteTour, quoteTransportByDay } from "@/lib/booking/pricing";
import type {
  District,
  Eatery,
  Experience,
  Festival,
  Homestay,
  Hotspot,
  Tour,
  TransportOption,
} from "@/types";
import {
  budgetLevels,
  groupTypes,
  paces,
  type BookingQuoteLine,
  type BookingQuoteResult,
  type BudgetLevel,
  type CatalogueItem,
  type CatalogueResults,
  type ItineraryDay,
  type ItineraryPlan,
  type ItineraryResult,
} from "./schema";

/* --------------------------------- Helpers ---------------------------------- */

const districts = [
  "Imphal East",
  "Imphal West",
  "Bishnupur",
  "Thoubal",
  "Kakching",
  "Churachandpur",
  "Ukhrul",
  "Senapati",
  "Tamenglong",
  "Chandel",
  "Jiribam",
  "Kamjong",
  "Noney",
  "Pherzawl",
  "Tengnoupal",
  "Kangpokpi",
] as const;

const districtEnum = z.enum(districts);

const MAX_ITEMS = 6;

function inr(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

/**
 * Join sentence fragments, skipping the empty ones.
 *
 * Catalogue rows legitimately have blank `bestTimeToVisit` / `entryFee` /
 * `hostName` fields. Interpolating those straight into a template produced
 * strings like "A Zeme village. . Entry: .", so each piece is checked before
 * it earns its full stop.
 */
function sentences(...parts: (string | undefined | null)[]): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .map((part) => (/[.!?]$/.test(part) ? part : `${part}.`))
    .join(" ");
}

/**
 * Seed rows carry literal placeholders where a field was never researched
 * (see `db/research-seed/0008_seed_2026_research.sql`). Printing one back at a
 * traveller ("Hosted by Host details to be confirmed") is worse than saying
 * nothing, so they are treated as absent.
 */
const PLACEHOLDERS = new Set(["host details to be confirmed", "tbc", "to be confirmed", "n/a", "unknown"]);

function real(value: string | undefined | null): string | undefined {
  const text = value?.trim();
  if (!text || PLACEHOLDERS.has(text.toLowerCase())) return undefined;
  return text;
}

function trim(text: string, max = 140): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function contains(haystack: string, needle: string | undefined): boolean {
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function matchesAny(haystack: string, needles: string[] | undefined): boolean {
  if (!needles || needles.length === 0) return true;
  const hay = haystack.toLowerCase();
  return needles.some((n) => hay.includes(n.toLowerCase()));
}

function emptyResults(heading: string, what: string): CatalogueResults {
  return {
    kind: "results",
    heading,
    count: 0,
    items: [],
    note: `No ${what} in the Discover Manipur catalogue match that yet. Say so plainly, offer to widen the search, and do not invent listings.`,
  };
}

function pack(heading: string, items: CatalogueItem[], what: string): CatalogueResults {
  if (items.length === 0) return emptyResults(heading, what);
  return { kind: "results", heading, count: items.length, items };
}

/* ------------------------------- Row → card ---------------------------------- */

function hotspotCard(h: Hotspot): CatalogueItem {
  return {
    kind: "place",
    slug: h.slug,
    title: h.name,
    summary: trim(h.tagline || h.description),
    href: `/hotspots/${h.slug}`,
    price: h.entryFee,
    meta: `${h.category} · ${h.district} · ${h.durationHours}h · ${h.distanceFromImphalKm}km from Imphal`,
    image: h.images[0]?.src,
  };
}

function homestayCard(h: Homestay): CatalogueItem {
  return {
    kind: "stay",
    slug: h.slug,
    title: h.title,
    summary: trim(h.description),
    href: `/homestays/${h.slug}`,
    price: `${inr(h.pricePerNight)} / night`,
    meta: `${h.location} · sleeps ${h.maxGuests} · ${h.rating.toFixed(1)}★ (${h.reviewCount})`,
    image: h.images[0]?.src,
  };
}

function experienceCard(e: Experience): CatalogueItem {
  return {
    kind: "experience",
    slug: e.slug,
    title: e.title,
    summary: trim(e.description),
    href: `/experiences/${e.slug}`,
    price: `${inr(e.pricePerPerson)} / person`,
    meta: `${e.category} · ${e.location} · ${e.durationHours}h`,
    image: e.images[0]?.src,
  };
}

function eateryCard(e: Eatery): CatalogueItem {
  return {
    kind: "eatery",
    slug: e.slug,
    title: e.name,
    summary: trim(e.description),
    href: `/eateries/${e.slug}`,
    price: "₹".repeat(e.priceRange),
    meta: `${e.cuisines.join(", ")} · ${e.location} · ${e.timings}`,
    image: e.images[0]?.src,
  };
}

function tourCard(t: Tour): CatalogueItem {
  return {
    kind: "tour",
    slug: t.slug,
    title: t.title,
    summary: trim(t.description),
    href: `/tours/${t.slug}`,
    price: `${inr(t.pricePerPerson)} / person`,
    meta: `${t.durationDays} days · ${t.difficulty} · ${t.themes.join(", ")}`,
    image: t.images[0]?.src,
  };
}

function festivalCard(f: Festival): CatalogueItem {
  return {
    kind: "festival",
    slug: f.slug,
    title: f.name,
    summary: trim(f.description),
    href: `/festivals/${f.slug}`,
    meta: `${f.month} · ${f.typicalDates} · ${f.location}`,
    image: f.images[0]?.src,
  };
}

function transportCard(t: TransportOption): CatalogueItem {
  return {
    kind: "transport",
    slug: t.slug,
    title: t.name,
    summary: trim(t.description),
    href: `/transport/${t.slug}`,
    price:
      t.pricePerDay
        ? `${inr(t.pricePerDay)} / day`
        : t.pricePerKm
          ? `${inr(t.pricePerKm)} / km`
          : undefined,
    meta: `${t.mode} · ${t.operator} · ${t.seats} seats · ${t.routes.slice(0, 2).join(", ")}`,
    image: t.images[0]?.src,
  };
}

/* --------------------------- Budget / pace tuning ---------------------------- */

const nightlyCeiling: Record<BudgetLevel, number> = {
  budget: 1500,
  comfortable: 3500,
  premium: Number.POSITIVE_INFINITY,
};

/** Rough per-day spend on meals, entry fees and extras, per budget tier. */
const perDaySpend: Record<BudgetLevel, number> = {
  budget: 900,
  comfortable: 1800,
  premium: 3500,
};

const stopsPerDay: Record<string, number> = {
  relaxed: 2,
  balanced: 3,
  packed: 4,
};

/* ------------------------------ Itinerary build ------------------------------ */

export interface AssembleInput {
  days: number;
  budget: BudgetLevel;
  interests: string[];
  travelMonth?: string;
  pace: string;
  groupType: string;
  accessibilityNeeds?: string;
  /** Optional total per-person budget in rupees. Tightens stays and flags overruns. */
  totalBudgetInr?: number;
}

/**
 * Builds a grounded skeleton itinerary straight from the catalogue.
 *
 * Deterministic on purpose: every stop, meal and stay is a real listing with a
 * real route, so nothing the concierge shows can be a hallucination. The model
 * then narrates around it.
 */
export async function assembleItinerary(input: AssembleInput): Promise<ItineraryResult> {
  const days = Math.max(1, Math.min(input.days, 14));
  const perDay = stopsPerDay[input.pace] ?? 3;
  const needsStepFree = Boolean(input.accessibilityNeeds?.trim());

  const [allPlaces, allStays, allEateries, allExperiences] = await Promise.all([
    getHotspots({ limit: 60 }),
    getHomestays({ limit: 40, sort: "price-asc" }),
    getEateries({ limit: 40 }),
    getExperiences({ limit: 40 }),
  ]);

  const interests = input.interests.map((i) => i.trim()).filter(Boolean);

  const scoredPlaces = [...allPlaces]
    .filter((p) => (needsStepFree ? p.accessibility.wheelchairAccessible : true))
    .sort((a, b) => {
      const score = (p: Hotspot) =>
        (matchesAny(`${p.name} ${p.tagline} ${p.category} ${p.tags.join(" ")}`, interests) ? 2 : 0) +
        (p.featured ? 1 : 0);
      return score(b) - score(a);
    });

  const scoredExperiences = [...allExperiences].sort((a, b) => {
    const score = (e: Experience) =>
      (matchesAny(`${e.title} ${e.category} ${e.description}`, interests) ? 2 : 0) + (e.featured ? 1 : 0);
    return score(b) - score(a);
  });

  const stays = allStays.filter((s) => s.pricePerNight <= nightlyCeiling[input.budget]);
  const stayPool = stays.length > 0 ? stays : allStays;

  // When a rupee figure is given, tighten the nightly ceiling so the plan has
  // a real chance of landing inside it: per night = (budget / days) − daily spend.
  const spendCeiling =
    input.totalBudgetInr && input.totalBudgetInr > 0
      ? Math.max(100, Math.floor((input.totalBudgetInr / days - perDaySpend[input.budget]) / 100) * 100)
      : nightlyCeiling[input.budget];
  const budgetedStays = allStays.filter((s) => s.pricePerNight <= spendCeiling);
  const budgetedPool = budgetedStays.length > 0 ? budgetedStays : stayPool;

  const plannedDays: ItineraryDay[] = [];
  let placeCursor = 0;
  let experienceCursor = 0;
  let eateryCursor = 0;

  for (let day = 1; day <= days; day += 1) {
    const stops: ItineraryDay["stops"] = [];

    for (let s = 0; s < perDay && scoredPlaces.length > 0; s += 1) {
      const place = scoredPlaces[placeCursor % scoredPlaces.length];
      placeCursor += 1;
      stops.push({
        title: place.name,
        slug: place.slug,
        href: `/hotspots/${place.slug}`,
        kind: "place",
        timeOfDay: s === 0 ? "morning" : s === 1 ? "midday" : s === 2 ? "afternoon" : "evening",
        note: trim(
          sentences(
            real(place.tagline),
            real(place.bestTimeToVisit),
            real(place.entryFee) ? `Entry: ${real(place.entryFee)}` : undefined,
          ),
          180,
        ),
      });
    }

    if (scoredExperiences.length > 0 && day % 2 === 1) {
      const exp = scoredExperiences[experienceCursor % scoredExperiences.length];
      experienceCursor += 1;
      stops.push({
        title: exp.title,
        slug: exp.slug,
        href: `/experiences/${exp.slug}`,
        kind: "experience",
        timeOfDay: "evening",
        note: trim(
          sentences(
            exp.description,
            exp.durationHours ? `${exp.durationHours}h${real(exp.host) ? ` with ${real(exp.host)}` : ""}` : undefined,
          ),
          180,
        ),
      });
    }

    const meals: ItineraryDay["meals"] = [];
    if (allEateries.length > 0) {
      const lunch = allEateries[eateryCursor % allEateries.length];
      eateryCursor += 1;
      meals.push({ slot: "lunch", suggestion: `${lunch.name}, ${lunch.location}`, href: `/eateries/${lunch.slug}` });
      const dinner = allEateries[eateryCursor % allEateries.length];
      eateryCursor += 1;
      meals.push({
        slot: "dinner",
        suggestion: `${dinner.name} (${dinner.signatureDishes[0]?.name ?? dinner.cuisines[0] ?? "local plates"})`,
        href: `/eateries/${dinner.slug}`,
      });
    }

    const stay = budgetedPool[(day - 1) % Math.max(budgetedPool.length, 1)];

    plannedDays.push({
      day,
      title: stops[0] ? `${stops[0].title} and around` : `Day ${day} in Manipur`,
      summary: stops.length
        ? `A ${input.pace} day built around ${stops.map((s) => s.title).join(", ")}.`
        : "An open day. We will fill this in once the catalogue has listings for your dates.",
      stops,
      meals,
      stay: stay
        ? {
            title: stay.title,
            href: `/homestays/${stay.slug}`,
            note: sentences(
              stay.pricePerNight > 0 ? `${inr(stay.pricePerNight)} a night` : "Nightly rate on request",
              real(stay.hostName) ? `Hosted by ${real(stay.hostName)}` : undefined,
            ),
          }
        : undefined,
      travelNotes: stops.length
        ? `Distances are short but roads are slow. Budget roughly ${stops.length * 45} minutes of driving across the day.`
        : undefined,
      estimatedCostInr: stay ? stay.pricePerNight + perDaySpend[input.budget] : undefined,
    });
  }

  const total = plannedDays.reduce((sum, d) => sum + (d.estimatedCostInr ?? 0), 0);
  const withinABudget = Boolean(input.totalBudgetInr && input.totalBudgetInr > 0);
  const overBudget = withinABudget && total > (input.totalBudgetInr ?? 0);

  const plan: ItineraryPlan = {
    title: `${days}-day Manipur itinerary${input.travelMonth ? ` for ${input.travelMonth}` : ""}`,
    overview: `A ${input.pace} ${input.budget} plan for a ${input.groupType} trip${
      withinABudget ? ` budgeted at about ${inr(input.totalBudgetInr ?? 0)} per person` : ""
    }${
      interests.length ? `, leaning into ${interests.join(", ")}` : ""
    }. Every stop below links to its page on Discover Manipur.`,
    travelMonth: input.travelMonth,
    pace: input.pace,
    groupType: input.groupType,
    days: plannedDays,
    totalEstimatedCostInr: total > 0 ? total : undefined,
    packingNotes: [
      "Layers: Imphal valley is mild, the hills get genuinely cold after dark.",
      "Cash: ATMs thin out fast outside Imphal.",
      "A power bank; supply can be patchy in village homestays.",
    ],
    permitsAndSafety: [
      "Indian nationals do not need an Inner Line Permit for Manipur, but some border and hill areas have local restrictions. Check with your host before you go.",
      "Foreign nationals must register with the FRRO; rules change, so confirm with the Manipur Tourism department or your embassy.",
      "Road conditions and access to hill districts change with the season and with local advisories. Verify current conditions with official sources before you travel.",
    ],
  };

  const notes: string[] = [];
  if (plannedDays.every((d) => d.stops.length === 0)) {
    notes.push(
      "The catalogue has no places seeded yet, so this is an empty skeleton. Tell the traveller honestly rather than inventing stops.",
    );
  }
  if (overBudget) {
    notes.push(
      `Rough estimate ${inr(total)} per person, above the ${inr(input.totalBudgetInr ?? 0)} budget you gave for ${days} days. Say so plainly and suggest trimming the trip length or dropping to a cheaper stay tier.`,
    );
  }

  return { kind: "itinerary", plan, note: notes.length > 0 ? notes.join(" ") : undefined };
}

/* ------------------------------- Booking quotes ------------------------------ */

function miss(
  quoteKind: BookingQuoteResult["quoteKind"],
  slug: string,
  startDate: string,
  guests: number,
  what: string,
): BookingQuoteResult {
  return {
    kind: "booking-quote",
    ok: false,
    quoteKind,
    refId: slug,
    refTitle: what,
    href: "",
    startDate,
    guests,
    lineItems: [],
    totalInr: 0,
    note: `I couldn't find that ${what} in the catalogue (slug “${slug}”). Don't invent it. Run the matching find* tool again and use the slug it returns.`,
  };
}

/**
 * Price a booking server-side with the same helpers as the listing forms
 * (`@/lib/booking/pricing`). This is only a quote: no money moves, and when the
 * traveller saves the request from the card, `requestBooking` looks the
 * listing up and prices it again before storing it.
 */
async function quoteBooking(input: {
  kind: "tour" | "homestay" | "experience" | "transport" | "table";
  slug: string;
  startDate: string;
  endDate?: string;
  guests: number;
}): Promise<BookingQuoteResult> {
  const { kind, slug, startDate, endDate } = input;
  const guests = Math.min(20, Math.max(1, input.guests));

  if (kind === "tour") {
    const tour = await getTourBySlug(slug);
    if (!tour) return miss(kind, slug, startDate, guests, "tour");
    const travellers = Math.min(tour.groupSizeMax, guests);
    const { subtotal, adjustment, total } = quoteTour({ pricePerPerson: tour.pricePerPerson, guests: travellers });
    const discount = -adjustment;
    const lineItems: BookingQuoteLine[] = [
      {
        label: `${formatINR(tour.pricePerPerson)} × ${travellers} traveller${travellers === 1 ? "" : "s"}`,
        amountInr: subtotal,
      },
    ];
    if (discount > 0) lineItems.push({ label: "Group of four or more (5% off)", amountInr: -discount });
    const scheduled = tour.departureDates.includes(startDate);
    const note = [
      scheduled
        ? "This is a scheduled departure."
        : tour.departureDates.length > 0
          ? `That date isn't a scheduled departure (scheduled: ${tour.departureDates.slice(0, 3).join(", ")}). Check availability with the organiser.`
          : "Check the date with the organiser.",
      "No payment online. Saving records a request; the organiser is not notified automatically yet, so contact them to confirm your place.",
    ].join(" ");
    return {
      kind: "booking-quote",
      ok: true,
      quoteKind: "tour",
      refId: tour.slug,
      refTitle: tour.title,
      href: `/tours/${tour.slug}`,
      startDate,
      guests: travellers,
      lineItems,
      totalInr: total,
      note,
    };
  }

  if (kind === "homestay") {
    const stay = await getHomestayBySlug(slug);
    if (!stay) return miss(kind, slug, startDate, guests, "homestay");
    if (!endDate) {
      return {
        ...miss(kind, slug, startDate, guests, "homestay"),
        note: "I need your check-out date too before I can price the stay.",
      };
    }
    const nights = nightsBetween(startDate, endDate);
    if (nights <= 0) {
      return {
        ...miss(kind, slug, startDate, guests, "homestay"),
        note: "Your check-out date is before check-in. Give me dates the other way round and I'll re-quote.",
      };
    }
    const { subtotal, serviceFee: fee, total } = quoteStay({
      pricePerNight: stay.pricePerNight,
      from: startDate,
      to: endDate,
    });
    return {
      kind: "booking-quote",
      ok: true,
      quoteKind: "homestay",
      refId: stay.slug,
      refTitle: stay.title,
      href: `/homestays/${stay.slug}`,
      startDate,
      endDate,
      guests,
      lineItems: [
        {
          label: `${nights} night${nights === 1 ? "" : "s"} × ${formatINR(stay.pricePerNight)}`,
          amountInr: subtotal,
        },
        { label: "Service fee (8%)", amountInr: fee },
      ],
      totalInr: total,
      note: "No payment online. Saving records a request; the host is not notified automatically yet, so contact them to confirm the stay. Check the cancellation policy on the listing.",
    };
  }

  if (kind === "experience") {
    const experience = await getExperienceBySlug(slug);
    if (!experience) return miss(kind, slug, startDate, guests, "experience");
    const people = Math.min(experience.groupSizeMax, guests);
    const {
      subtotal,
      adjustment: fee,
      total,
    } = quoteExperience({ pricePerPerson: experience.pricePerPerson, guests: people });
    return {
      kind: "booking-quote",
      ok: true,
      quoteKind: "experience",
      refId: experience.slug,
      refTitle: experience.title,
      href: `/experiences/${experience.slug}`,
      startDate,
      guests: people,
      lineItems: [
        {
          label: `${formatINR(experience.pricePerPerson)} × ${people} person${people === 1 ? "" : "s"}`,
          amountInr: subtotal,
        },
        { label: "Experience fee (5%)", amountInr: fee },
      ],
      totalInr: total,
      note: "No payment online. Saving records a request; the host is not notified automatically yet, so contact them to confirm the date.",
    };
  }

  if (kind === "transport") {
    const transport = await getTransportBySlug(slug);
    if (!transport) return miss(kind, slug, startDate, guests, "transport option");
    if (transport.pricePerDay) {
      const { days, total } = quoteTransportByDay({
        pricePerDay: transport.pricePerDay,
        startDate,
        endDate,
      });
      return {
        kind: "booking-quote",
        ok: true,
        quoteKind: "transport",
        refId: transport.slug,
        refTitle: transport.name,
        href: `/transport/${transport.slug}`,
        startDate,
        endDate,
        guests,
        lineItems: [{ label: `${days} day${days === 1 ? "" : "s"} × ${formatINR(transport.pricePerDay)}`, amountInr: total }],
        totalInr: total,
        note: endDate
          ? "No payment online. Saving records a request on your bookings page; the operator is not notified automatically yet, so contact them to confirm."
          : "You didn't give a return date, so I priced a single day. Tell me your dates and I'll re-quote.",
      };
    }
    return {
      kind: "booking-quote",
      ok: true,
      quoteKind: "transport",
      refId: transport.slug,
      refTitle: transport.name,
      href: `/transport/${transport.slug}`,
      startDate,
      endDate,
      guests,
      lineItems: [],
      totalInr: 0,
      note: `This option is priced per kilometre, so I can't total it without your route. Get in touch with ${transport.operator} to lock in a rate.`,
    };
  }

  const eatery = await getEateryBySlug(slug);
  if (!eatery) return miss(kind, slug, startDate, guests, "eatery");
  return {
    kind: "booking-quote",
    ok: true,
    quoteKind: "table",
    refId: eatery.slug,
    refTitle: eatery.name,
    href: `/eateries/${eatery.slug}`,
    startDate,
    guests,
    lineItems: [],
    totalInr: 0,
    note: eatery.acceptsReservations
      ? "Free to request. Saving records the request; the eatery is not notified automatically, so call ahead to hold the table."
      : "This place doesn't take reservations formally. Saving only records your plan, so call ahead or walk in.",
  };
}

/* ---------------------------------- Tools ------------------------------------ */

export const conciergeTools = {
  searchPlaces: tool({
    description:
      "Search Discover Manipur's catalogue of places to visit in Manipur: lakes, hills, heritage sites, markets, waterfalls, wildlife. Use this before recommending any place.",
    inputSchema: z.object({
      query: z.string().optional().describe("Free text, e.g. 'floating lake', 'war memorial', 'sunrise viewpoint'."),
      district: districtEnum.optional(),
      category: z
        .enum([
          "lake",
          "hill",
          "heritage",
          "wildlife",
          "waterfall",
          "temple",
          "museum",
          "market",
          "village",
          "memorial",
          "cave",
          "park",
        ])
        .optional(),
      wheelchairAccessible: z.boolean().optional(),
      limit: z.number().int().min(1).max(MAX_ITEMS).default(4),
    }),
    execute: async ({ query, district, category, wheelchairAccessible, limit }) => {
      const rows = await getHotspots({
        search: query,
        district: district as District | undefined,
        limit: 60,
      });
      const filtered = rows
        .filter((h) => (category ? h.category === category : true))
        .filter((h) => (wheelchairAccessible ? h.accessibility.wheelchairAccessible : true))
        .slice(0, limit);
      return pack(query ? `Places matching “${query}”` : "Places to visit", filtered.map(hotspotCard), "places");
    },
  }),

  findStays: tool({
    description: "Find homestays on Discover Manipur. Use for any question about where to sleep, hosts, or nightly prices.",
    inputSchema: z.object({
      query: z.string().optional(),
      district: districtEnum.optional(),
      maxPricePerNight: z.number().int().positive().optional().describe("Rupees per night."),
      guests: z.number().int().min(1).max(20).optional(),
      limit: z.number().int().min(1).max(MAX_ITEMS).default(4),
    }),
    execute: async ({ query, district, maxPricePerNight, guests, limit }) => {
      const rows = await getHomestays({
        search: query,
        district: district as District | undefined,
        limit: 60,
        sort: "price-asc",
      });
      const filtered = rows
        .filter((h) => (maxPricePerNight ? h.pricePerNight <= maxPricePerNight : true))
        .filter((h) => (guests ? h.maxGuests >= guests : true))
        .slice(0, limit);
      return pack("Homestays", filtered.map(homestayCard), "homestays");
    },
  }),

  findExperiences: tool({
    description:
      "Find bookable experiences: weaving, cooking, festivals, treks, wellness, wildlife. Use whenever someone asks what to *do*.",
    inputSchema: z.object({
      query: z.string().optional(),
      category: z
        .enum([
          "craft",
          "cuisine",
          "festival",
          "adventure",
          "wellness",
          "music",
          "textile",
          "agriculture",
          "wildlife",
        ])
        .optional(),
      district: districtEnum.optional(),
      maxPricePerPerson: z.number().int().positive().optional(),
      limit: z.number().int().min(1).max(MAX_ITEMS).default(4),
    }),
    execute: async ({ query, category, district, maxPricePerPerson, limit }) => {
      const rows = await getExperiences({
        search: query,
        district: district as District | undefined,
        limit: 60,
      });
      const filtered = rows
        .filter((e) => (category ? e.category === category : true))
        .filter((e) => (maxPricePerPerson ? e.pricePerPerson <= maxPricePerPerson : true))
        .slice(0, limit);
      return pack("Experiences", filtered.map(experienceCard), "experiences");
    },
  }),

  findEateries: tool({
    description: "Find places to eat: Manipuri, Naga, Kuki, cafés, street food. Use for any food question.",
    inputSchema: z.object({
      query: z.string().optional().describe("Dish or vibe, e.g. 'eromba', 'chak-hao', 'vegan café'."),
      cuisine: z
        .enum(["manipuri", "naga", "kuki", "north-indian", "chinese", "cafe", "street-food", "vegan"])
        .optional(),
      district: districtEnum.optional(),
      maxPriceRange: z.number().int().min(1).max(3).optional().describe("1 = cheap, 3 = splurge."),
      limit: z.number().int().min(1).max(MAX_ITEMS).default(4),
    }),
    execute: async ({ query, cuisine, district, maxPriceRange, limit }) => {
      const rows = await getEateries({
        search: query,
        district: district as District | undefined,
        limit: 60,
      });
      const filtered = rows
        .filter((e) => (cuisine ? e.cuisines.includes(cuisine) : true))
        .filter((e) => (maxPriceRange ? e.priceRange <= maxPriceRange : true))
        .filter((e) =>
          query ? contains(`${e.name} ${e.description} ${e.signatureDishes.map((d) => d.name).join(" ")}`, query) : true,
        )
        .slice(0, limit);
      return pack("Places to eat", filtered.map(eateryCard), "eateries");
    },
  }),

  findTours: tool({
    description: "Find curated multi-day tours already packaged by Discover Manipur. Prefer these when someone wants everything organised.",
    inputSchema: z.object({
      query: z.string().optional(),
      maxDurationDays: z.number().int().min(1).max(21).optional(),
      difficulty: z.enum(["easy", "moderate", "challenging"]).optional(),
      maxPricePerPerson: z.number().int().positive().optional(),
      limit: z.number().int().min(1).max(MAX_ITEMS).default(3),
    }),
    execute: async ({ query, maxDurationDays, difficulty, maxPricePerPerson, limit }) => {
      const rows = await getTours({ search: query, limit: 40 });
      const filtered = rows
        .filter((t) => (maxDurationDays ? t.durationDays <= maxDurationDays : true))
        .filter((t) => (difficulty ? t.difficulty === difficulty : true))
        .filter((t) => (maxPricePerPerson ? t.pricePerPerson <= maxPricePerPerson : true))
        .slice(0, limit);
      return pack("Curated tours", filtered.map(tourCard), "tours");
    },
  }),

  getFestivalCalendar: tool({
    description:
      "Look up Manipuri festivals by month. Use when someone gives travel dates, or asks what is on while they are there.",
    inputSchema: z.object({
      month: z.string().optional().describe("Month name, e.g. 'November'."),
      query: z.string().optional(),
      limit: z.number().int().min(1).max(MAX_ITEMS).default(5),
    }),
    execute: async ({ month, query, limit }) => {
      const rows = await getFestivals({ search: query, limit: 60 });
      const filtered = rows
        .filter((f) => (month ? contains(f.month, month) : true))
        .slice(0, limit);
      return pack(month ? `Festivals in ${month}` : "Festival calendar", filtered.map(festivalCard), "festivals");
    },
  }),

  buildItinerary: tool({
    description:
      "Assemble a grounded day-by-day itinerary from real Discover Manipur listings. Call this once you know roughly how many days, the budget and the interests. The result renders as a timeline in the chat. Introduce it in a sentence or two rather than repeating it.",
    inputSchema: z.object({
      days: z.number().int().min(1).max(14).default(4),
      budget: z.enum(budgetLevels).default("comfortable"),
      interests: z.array(z.string()).default([]),
      travelMonth: z.string().optional(),
      pace: z.enum(paces).default("balanced"),
      groupType: z.enum(groupTypes).default("couple"),
      accessibilityNeeds: z.string().optional(),
      totalBudgetInr: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Total per-person budget in rupees, when the traveller gives a figure."),
    }),
    execute: async (input) => assembleItinerary(input),
  }),

  findTransport: tool({
    description:
      "Find transport options in Manipur: cabs, SUVs, tempos, bikes and shared sumos by the day or per kilometre. Use for any question about getting around.",
    inputSchema: z.object({
      query: z.string().optional().describe("Route or vibe, e.g. 'Imphal to Moirang', 'airport pickup'."),
      mode: z.enum(["cab", "suv", "tempo", "bike", "shared-sumo", "bus"]).optional(),
      maxPricePerDay: z.number().int().positive().optional(),
      limit: z.number().int().min(1).max(MAX_ITEMS).default(4),
    }),
    execute: async ({ query, mode, maxPricePerDay, limit }) => {
      const rows = await getTransportOptions({ search: query, limit: 40 });
      const filtered = rows
        .filter((t) => (mode ? t.mode === mode : true))
        .filter((t) => (maxPricePerDay ? (t.pricePerDay ?? Number.POSITIVE_INFINITY) <= maxPricePerDay : true))
        .slice(0, limit);
      return pack("Getting around", filtered.map(transportCard), "transport options");
    },
  }),

  quoteBooking: tool({
    description:
      "Quote and book a listing the traveller has already picked: a tour departure, a homestay stay, an experience, transport by the day, or a free table reservation. Call findTours/findStays/findExperiences/findTransport first so you have the real slug, then call this with the confirmed dates and guests. The result renders as a card with a booking button; introduce it and let the traveller confirm.",
    inputSchema: z.object({
      kind: z
        .enum(["tour", "homestay", "experience", "transport", "table"])
        .describe("What is being booked. 'table' means reserving a table at an eatery (free)."),
      slug: z.string().describe("The listing's catalogue slug, from a find* tool result."),
      startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Departure/check-in date as YYYY-MM-DD."),
      endDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe("Check-out date as YYYY-MM-DD (required for homestays)."),
      guests: z.number().int().min(1).max(20).default(2),
    }),
    execute: async (input) => quoteBooking(input),
  }),
};

export type ConciergeTools = typeof conciergeTools;
