/**
 * The curated sample conversation shown on `/plan` while the live concierge is
 * switched off.
 *
 * This is a *showcase*, not a mock. Every card, price, link and itinerary stop
 * below is assembled from the same catalogue the live tools read, by the same
 * `execute` functions, so nothing here can drift from the real site, and every
 * link a visitor clicks lands on a real page. Only the assistant's prose is
 * written by hand, because that is the one part an LLM would otherwise produce.
 *
 * Server-side only: it touches the data layer (there is no `server-only`
 * package in this project, so treat the boundary as a convention). `/plan`
 * builds the turns and hands them to the client already resolved.
 */

import { conciergeTools } from "./tools";
import { sampleItinerary } from "./fallback";
import type { CatalogueResults, ConciergeToolOutput } from "./schema";

/** One question-and-answer exchange in the sample transcript. */
export interface ShowcaseTurn {
  id: string;
  /** What the visitor asked. */
  question: string;
  /** The concierge's prose reply, in the same markdown the live model emits. */
  answer: string;
  /** Tool names, shown as "working" chips before the answer lands. */
  tools: string[];
  /** Cards rendered beneath the prose, in order. */
  outputs: ConciergeToolOutput[];
  /** A short label for the chip that selects this turn. */
  chip: string;
}

/**
 * The AI SDK types `execute` as taking a call-options bag it does not use for
 * these tools. Nothing here is a real tool call, so a minimal stand-in is
 * honest and keeps the showcase from needing a parallel set of query helpers.
 */
const CALL_STUB = { toolCallId: "showcase", messages: [] } as never;

async function run<K extends keyof typeof conciergeTools>(
  name: K,
  input: Parameters<NonNullable<(typeof conciergeTools)[K]["execute"]>>[0],
): Promise<ConciergeToolOutput | null> {
  const execute = conciergeTools[name].execute;
  if (!execute) return null;
  try {
    const output = (await execute(input as never, CALL_STUB)) as ConciergeToolOutput;
    // A results card with nothing in it teaches a visitor nothing; drop it and
    // let the turn fall away rather than showing an empty shelf.
    if (output && "items" in output && (output as CatalogueResults).items.length === 0) return null;
    return output;
  } catch {
    return null;
  }
}

/**
 * Build the sample transcript.
 *
 * Turns whose catalogue lookup came back empty are dropped, so a partially
 * seeded database degrades to a shorter conversation rather than a broken one.
 */
export async function buildShowcase(): Promise<ShowcaseTurn[]> {
  const [itinerary, stays, eateries, experiences, festivals] = await Promise.all([
    sampleItinerary(4),
    run("findStays", { query: "Loktak", limit: 3 }),
    run("findEateries", { query: "Imphal", limit: 3 }),
    run("findExperiences", { category: "craft", limit: 3 }),
    run("getFestivalCalendar", { limit: 3 }),
  ]);

  const turns: (ShowcaseTurn | null)[] = [
    itinerary && {
      id: "itinerary",
      chip: "Build me a plan",
      question: "We've got 4 days in December, ₹40,000 for two. Lake, heritage, food. Not too rushed.",
      tools: ["searchPlaces", "findStays", "buildItinerary"],
      answer: [
        "Four days is a good fit for the valley plus one hill day, enough to see Loktak properly without living in the car.",
        "",
        "Here's how I'd shape it. Roads are slower than the map suggests, so I've kept each day to one anchor and left the afternoons loose.",
      ].join("\n"),
      outputs: [itinerary],
    },

    stays && {
      id: "stays",
      chip: "Where do I sleep?",
      question: "Where can I stay on Loktak Lake?",
      tools: ["findStays"],
      answer: [
        "Loktak stays are mostly family homestays rather than hotels: you're booking a room in someone's house, and that is the point.",
        "",
        "These are the ones listed with us. Prices are per night; message the host before you book if you want a lake-facing room, since not every room has one.",
      ].join("\n"),
      outputs: [stays],
    },

    eateries && {
      id: "food",
      chip: "What do I eat?",
      question: "What should I eat in Imphal, and where?",
      tools: ["findEateries"],
      answer: [
        "Eat **eromba** at least once: mashed vegetables with roasted chilli and *ngari*, the fermented fish that carries most of Meitei cooking. Then **singju**, a raw salad that is hotter than it looks, and **chak-hao kheer**, the black rice pudding.",
        "",
        "Where to find it:",
      ].join("\n"),
      outputs: [eateries],
    },

    experiences && {
      id: "craft",
      chip: "Meet a weaver",
      question: "I want to meet a weaver, not just buy a shawl. Is that possible?",
      tools: ["findExperiences"],
      answer: [
        "Yes, and it's the better version of the same afternoon. Manipuri handloom is largely woven at home on loin looms, so these sessions happen in a working room with the weaver who made what you're looking at.",
        "",
        "Bring cash; most weavers don't take cards.",
      ].join("\n"),
      outputs: [experiences],
    },

    festivals && {
      id: "festivals",
      chip: "What's on?",
      question: "Anything worth timing a trip around?",
      tools: ["getFestivalCalendar"],
      answer: [
        "A few things, and they genuinely change what the trip feels like. Book stays early for any of these, because the valley fills up.",
        "",
        "Dates shift with the lunar calendar, so treat these as the window rather than the day and confirm before you book flights.",
      ].join("\n"),
      outputs: [festivals],
    },
  ];

  return turns.filter((turn): turn is ShowcaseTurn => turn !== null);
}
