# Manipur tourism research dataset

Collected 2026-09-23 by web research for the Yening platform. Everything here is real,
named and sourced. Nothing in these files is invented.

## Why this exists

The hotspot seed in `src/lib/data/seed/hotspots.ts` is genuine — 50 real places with real
history. The other three seed files are not:

| File | Status |
|---|---|
| `seed/hotspots.ts` | Real places. Keep. This dataset **adds to** it. |
| `seed/homestays.ts` | 20 invented properties with invented host names. **Replace.** |
| `seed/eateries.ts` | 16 invented businesses ("Bamboo Hut Garden Cafe", "Valley Organic Bistro", "Royal Kangla Kitchen"). **Replace.** |
| `seed/transport.ts` | 10 invented operators ("Manipur Tourism Verified Cabs", "Thanga Boatmen's Collective"). **Replace.** |

Listing a fictional homestay with a fictional host on a live tourism platform is the kind of
thing that gets a platform taken seriously exactly once. These four JSON files are the
replacement.

## Files

| File | Records | Maps to |
|---|---|---|
| `places.json` | 24 places not already in the hotspot seed, most of them genuinely little-visited | `public.hotspots` |
| `stays.json` | 8 homestays, 41 hotels/lodges/resorts, 4 government rest houses | `public.homestays` (+ a new table for hotels) |
| `eateries.json` | 37 open Imphal restaurants and cafes, 5 Ukhrul eateries, 12 confirmed-closed | `public.eateries` |
| `transport-and-operators.json` | 15 MATO tour operators, 5 official taxi services, 1 self-drive rental | `public.transport_options` (+ an operators table) |
| `google-maps-findings.json` | **Second pass, Google Maps:** 35 new places, 95 eateries across 4 districts, 10 stays, 13 transport/rental businesses | all of the above |
| `imphal-deep-dive.json` | **Third pass, Imphal only:** 7 rating corrections, 15 new eateries, 21 stays, 14 heritage/craft sites, 20 temples & parks | all of the above |
| `photos.json` + `PHOTOS.md` | **Photo candidates** from Wikimedia Commons, with licence and attribution per image. Read `PHOTOS.md` first — these are candidates, not cleared assets | `hotspots.images` / `photo-credits.ts` |
| `scripts/` | The Commons harvester and its subject list | — |
| `raw/` | The source extracts these were built from, including the MATO PDF | — |

### The Google Maps pass

`google-maps-findings.json` came from driving a headless browser at Google Maps place search,
one district viewport per query, scrolling the results panel to exhaustion and reading the
cards out of the DOM. It closed three of the four gaps listed at the bottom of this file:

- **Eateries outside Imphal** — 95 records across Churachandpur/Lamka (26), Ukhrul (29),
  Senapati (20) and the Moirang/Loktak belt (20). Lamka alone has a cafe with 992 reviews
  that appears in no travel writing anywhere.
- **Two-wheeler rental** — six real Imphal rental businesses with phone numbers, replacing
  the national lead-generation directories that dominate search results.
- **Loktak stays** — three floating homestays, including the 207-review Loktak Aquamarine
  (which turns out to be the same operator as the officially registered one) and the
  previously unknown Laisoi Farm Floating Homestay at 4.8.

It also produced 35 places in neither the hotspot seed nor `places.json`, and independently
corroborated 11 that are — including precise locations for Zeilad Lake and the Khoupum cave.

Two things Maps is good for that the rest of the dataset cannot give you: **review counts**,
which are the single best signal of whether a business is real and still trading, and
**Plus Codes**, which resolve to exact coordinates.

### The Imphal deep dive

`imphal-deep-dive.json` is a third pass, four category sweeps over the Imphal viewport alone.
It did three things:

1. **Corrected the Imphal eatery ratings.** The first pass took these from wanderlog, which
   carried no review counts. Going to Maps directly showed Luxmi Kitchen has **2,088 reviews**,
   Asian Bowl 795, Char-koal 644 — and turned up **Leirung Resto at 4.7 with 972 reviews**,
   which no earlier source mentioned at all.
2. **Found the heritage layer.** RKCS Art Gallery (400 reviews), Three Mothers Art Gallery
   (320, free entry), the state Handloom & Handicrafts Corporation, Akhom Handicraft, Rani
   Handloom House. For a platform themed on Heritage & Culture this is the most valuable block
   in the dataset, and none of it appears in the existing seed.
3. **Found the indigenous Meitei religious sites.** Hiyangthang Lairembi (385 reviews),
   Lainingthou Sanamahi Kiyong (4.7), and the Marjing Polo Statue. The seed covers Govindajee,
   which is Vaishnav, but nothing of Sanamahism — the older indigenous faith. Treat these as
   active religious sites and agree the protocol with the community before publishing.

## Photographs

See `PHOTOS.md`. Short version: the Maps passes gave us names, ratings and addresses —
facts, free to use. Their **photos are not**, and crediting them does not change that;
attribution satisfies a licence, it does not create one. Photo candidates therefore come
from Wikimedia Commons only, on the same basis as the existing `photo-credits.ts`.

Coverage is uneven by nature — deep on Loktak and Kangla, near-empty on the hidden-gem
set, which is why they are hidden gems. Plan on commissioning locally or sourcing from
the businesses themselves for the rest.

## Verification levels

Every record carries a `verification` field:

- **`official`** — named on a `manipurtourism.gov.in` or `*.nic.in` government page. Highest confidence.
- **`corroborated`** — two or more independent non-government sources agree.
- **`single-source`** — one source only. Confirm before publishing.

## Before any of this goes live

1. **Phone-verify every business.** The Imphal F&B scene turned over heavily after 2023;
   `eateries.json` already lists 12 places that closed but are still being recommended by
   2026-dated travel listicles. Assume the same rot affects the stays and rentals.
2. **Get consent for personal contact details.** Many of the phone numbers here are hosts'
   personal mobiles. They are already published on government pages, which makes them lawful
   to read — it does not make them yours to republish. Get written consent per host.
3. **Geocode, do not guess.** `coordinates` is `null` almost everywhere on purpose. Several
   records carry Google Plus Codes (`RW4M+H25`) from the source — resolve those. For villages,
   geocode the village name. Never place a pin you cannot justify.
4. **Re-pull ratings.** The `google_rating` / `tripadvisor_rating` values are a 2026-09-23
   snapshot aggregated by a third party. They are context for your team, not Yening's ratings,
   and should not be displayed as if they were.
5. **Check district advisories.** Churachandpur, Chandel, Kamjong, Tengnoupal and Moreh are
   border or sensitive districts. Confirm current access before publishing anything there as
   visitable.
6. **Resolve the conflicts.** `places.json` has an `unresolved_conflicts` block — the
   Sadu Chiru / Leimaram question, and whether Keibul Homestay and Loktak Aquamarine Homestay
   are the same business. Both need a phone call.

## Attribution

Facts are not copyrightable, but the descriptive text in these files is newly written, not
copied. Where you publish a record, credit the source. Suggested footer per listing:

> Source: Directorate of Tourism, Government of Manipur (manipurtourism.gov.in). Details last
> verified DD-MM-YYYY. Confirm timings and fares locally before travelling.

Two sources deserve named credit if you use them:

- **Susan Zingkhai**, *Where We Eat in Ukhrul* (susanzingkhai.substack.com) — the only
  first-hand local reporting found on Ukhrul's eateries, and the source for four of the five
  Ukhrul records.
- **Responsible Tourism India** — the source for the Maipakchao homestay's community-income
  context.

## Sources used

Government:
- manipurtourism.gov.in — district destinations, escape-to-the-hills, in-and-around-Loktak,
  find-accommodation, taxi-services, the MATO operator list (PDF), two registered homestay pages
- senapati.nic.in, ukhrul.nic.in, churachandpur.nic.in, thoubal.nic.in, imphalwest.nic.in,
  imphaleast.nic.in, bishnupur.nic.in, tamenglong.nic.in, noney.nic.in
- incredibleindia.gov.in

Independent:
- wanderlog.com (Google/TripAdvisor aggregation for Imphal F&B)
- susanzingkhai.substack.com, ukhrultimes.com, thesangaiexpress.com, thefrontiermanipur.com,
  northeasttoday.in, northeastindiaconnect.com
- homestaysofindia.com, responsibletourismindia.com
- en.wikipedia.org (Stonehenge of Manipur, Maibam Lotpa Ching, Ithai Barrage, Longpi,
  Nongmaiching Hill, Phuba Khuman)

Rejected as unreliable — see `rejected_sources` in `transport-and-operators.json` and
`unverified_do_not_publish` in `eateries.json`:
- travelsetu.com (programmatically generated; invents business names)
- sulekha.com, transrentals.in, rentalrani.com, safarcabby.com, findonrent.com and similar
  rental lead-generation directories (no real local operators behind them)

## Known gaps

~~**No verified eateries outside Imphal and Ukhrul.**~~ Closed by the Maps pass for
Churachandpur, Senapati and Moirang/Loktak. **Still open:** Tamenglong, Noney, Thoubal,
Kakching, Chandel, Moreh, Jiribam — same method will work, one viewport per district.

~~**No two-wheeler rental.**~~ Closed — six real operators in `google-maps-findings.json`.

Still open:

- **No shared-Sumo / inter-district hill service** operator is published anywhere, and these
  do not appear on Maps as businesses either. This is how most people actually reach the hill
  districts. Needs a phone call to the operators' association in Imphal.
- **No menu prices.** Maps gives a ₹ band per place, not a menu.
- **No exact coordinates.** Every Plus Code in `google-maps-findings.json` resolves to a precise
  point, and each Maps place URL carries its lat/lng — a cheap follow-up pass.
- **No email addresses, and phone only where a Maps card happened to show one.** Opening each
  place's detail panel yields phone, website, full address and the full hours grid. That is a
  second pass of roughly one navigation per place.
- **Loktak boat operators** are not registered publicly. Route boat bookings through the Loktak
  homestays rather than inventing a collective.

What is left needs phone calls and someone on the ground, not more scraping.
