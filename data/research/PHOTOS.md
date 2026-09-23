# Photographs for place listings

You asked for 5–6 photos per place, and said you can credit the source. Credit is the
right instinct and it unlocks a lot — but it is worth being exact about what it does
and does not do, because the difference decides what we can ship.

## SOLVED — 335 of 359 listings have 2+ photos, 310 have 6+

Three sources were run. `photos-index.json` is the merged view: one row per listing,
counts from each source, and a recommended source per place.

| Source | Subjects with ≥1 | With ≥6 | Terms |
|---|---|---|---|
| **Google Places API** | 332 / 350 | 300 | Display-only, runtime fetch, attribution required |
| **Wikimedia Commons** | 45 / 64 | 23 | CC/PD — download and own the files |
| **Openverse** | 19 / 41 chased | — | CC — same as Commons |

**Google Places rescued all 19 subjects that both CC libraries had nothing for** —
Yangkhullen, Khangkhui Cave, Zeilad Lake, Buning Meadows, Red Hill, Santhei Park,
Khoupum Valley, Mova Cave, RKCS Gallery, Hiyangthang Lairembi and the rest, each with
10 photos. The pattern is exactly what you'd predict: CC libraries follow Wikipedia,
Google follows footfall.

### Which source to use where

Prefer **Commons/Openverse wherever `owned_assets >= 2`** — 45 listings, mostly the
famous places and the cultural subjects. You own those files, can resize and serve them
yourself, and there is no per-render cost.

Use **Google Places for everything else**, which is nearly all the businesses. CC
libraries do not photograph cafés; Google's users do.

## What crediting does and does not buy you

**Credit satisfies a licence. It does not create one.**

- A **CC BY** or **CC BY-SA** photo asks for attribution. Give the credit and you are
  square — this is most of Wikimedia Commons, and it is genuinely yours to use,
  commercially, on a live platform.
- A photo on **Google Maps, TripAdvisor, Instagram, or a travel blog** belongs to the
  person who took it and carries no licence at all. Adding "Photo: Google Maps" under
  it changes nothing legally. It is still infringement, and on a tourism platform with
  a public brand it is the kind that gets noticed.

So: the ~150 Maps listings in the last two passes gave us names, ratings and addresses,
which are facts and free to use. Their photos are not, and I have not touched them.

## What I built instead

`scripts/harvest_commons_photos.py` harvests candidates from Wikimedia Commons, which
is the same basis `src/lib/data/photo-credits.ts` already uses. Output: `photos.json`.

Per image it captures the file title, direct URL, a 400px thumbnail, dimensions,
licence, artist, date, caption, and the Commons file page. That is everything needed to
render a credit in the existing `PhotoCredit` shape.

### Filters applied

| Rule | Why |
|---|---|
| CC0 / public domain / CC BY / CC BY-SA only | Anything else, including "no licence template found", is dropped rather than guessed at |
| NC and ND explicitly refused | A commercial platform cannot use non-commercial images |
| Minimum width 800px | Below that it is not usable as a hero or card |
| No SVG | Diagrams and maps, not photographs |
| Duplicates collapsed | Commons re-hosts the same shot under near-identical names; without this, one subject fills all six slots |

### The relevance problem, and how it is handled

Commons search matches the whole file page, so the first cut was bad in a specific way:
a query for Kangla Fort returned a silky oak tree that grows inside Kangla, and Loktak
Lake returned a Chinese rubythroat photographed beside it. Both files are *correctly
filed*. Neither is a picture of the place.

The tell is where the place name sits in the title — Commons titles lead with the
subject and trail with the location. `Kangla Fort, Imphal.JPG` is a photo of the fort;
`Chinese Rubythroat ... Loktak Lake` is a photo of a bird. The harvester scores
position, not just presence, and splits results into two lists:

- **`likely_depicts`** — the file's own title or caption names the place, and names it
  early. Start here.
- **`nearby_subject_unconfirmed`** — correctly licensed and in the right area, but
  nothing states what it shows. Sometimes useful for atmosphere. Never publish from
  this list without opening it.

## This is a candidate list, not a cleared one

Two things still need a human, and neither can be automated away:

1. **Open every image before use.** `photo-credits.ts` already warns that Commons files
   are often filed under a subject they do not depict, and this project has been caught
   by it before — part of the current `public/file-uploads/` library is Dutch maps and
   generic resort stock. The position heuristic cuts the noise; it does not replace
   looking.
2. **Re-read the licence on the file page.** The API returns a short name, which is a
   summary. CC BY-SA in particular is share-alike, which has implications for how a
   composited or heavily edited derivative can be licensed.

Then: resize, convert to WebP, and add a `PhotoCredit` entry with artist, licence and
file-page URL, exactly as the existing pipeline does.

## Actual coverage (64 subjects, 297 usable candidates)

| Result | Count | Subjects |
|---|---|---|
| **6 or more** | 23 | Kangla Fort (13), Loktak Lake (16), Keibul Lamjao (14), Andro (14), Moreh (14), Ukhrul (12), Imphal War Cemetery (11), Phangrei (16), Raas Leela (19), Lai Haraoba (18), Sangai deer (14), Sagol Kangjei (8), Manipuri cuisine (8), phanek/handloom (8), Sendra, Govindajee, Zoological Garden, Koubru, Mapal Kangjeibung, Chingkhei Ching, Shirui Lily, Yaoshang, Loktak fishermen |
| **1–5** | 22 | Shirui Kashong (5), Imphal Peace Museum (5), Shaheed Minar (5), INA Memorial (4), Thangjing (4), Dzukou (3), Longpi (3), Khongjom (3), Orchidarium (3), Nupi Lal (3), Ima Keithel (2), State Museum (2), Sadu Chiru (2), Maram Khullen (2), Sanamahi Kiyong (2), Langol (2), and 6 more with 1 |
| **Zero** | 19 | Khangkhui Cave, Barak Waterfall, Zeilad Lake, Buning Meadows, Yangkhullen, Red Hill, Santhei Park, Nillai Tea Estate, Khoupum Valley, Ithai Barrage, Loukoi Pat, Bro Waterfall, Kachouphung, ISKCON Imphal, Hiyangthang Lairembi, RKCS Gallery, Mahabali Temple, Chingarel Park, Mova Cave |

A caution about how this number was arrived at. The first full run reported **48 of 64 as
"nothing found"** — and that was wrong. They were HTTP 429 rate limits being recorded as
empty results. A throttled request and a genuinely empty one looked identical in the
output, which is a bad failure mode for a dataset meant to be trusted. The harvester now
backs off exponentially and retries, and `--resume` redoes only the places whose queries
errored. The figures above are from a clean run with zero errored queries. If you re-run
this and see a sudden cliff in coverage, suspect throttling before you believe it.

The 19 zeros are real. Several are surprising — ISKCON Imphal returned one file and it
failed the licence check; Santhei Natural Park returned nothing at all despite 1,196
Google reviews. Note the pattern: **the zeros are almost entirely the Google Maps finds
and the hidden gems**, that is, the places with no Wikipedia article. Commons tracks
Wikipedia, not tourism. Nothing will change that by searching harder.

Realistic options for the 19 zeros and the thin partials, best first:

1. **Commission or crowdsource locally.** A photographer in Imphal, or a call for
   submissions with a clear licence grant, is the only route that gets you consistent
   6-photo sets and a library you own outright. For a hackathon build this is also the
   best story: the platform's photography comes from the community it is about.
2. **Ask the businesses.** Homestays, cafés and operators almost always have their own
   photos and are glad to have them used. Get the grant in writing when you onboard
   them — it belongs in the host agreement anyway.
3. **Ask the Directorate of Tourism.** `0385 242 1794`, or the Tourism Corporation of
   Manipur office at North AOC. State bodies often hold usable photo libraries and will
   licence them for a project promoting the state.
4. **Design for variable coverage.** Some places will have one good photo and some will
   have none. A layout that needs exactly six everywhere will force bad choices — a
   card that works with one strong image is better than six padded ones.

## Do not do this

- Hotlink anything. Even correctly licensed Commons files should be downloaded,
  resized and served from your own storage.
- Screenshot or scrape Maps, TripAdvisor or Instagram photos, with or without credit.
  Those images belong to the individual photographers, not to the platform hosting them,
  so a credit line does not make the copy lawful. Use the Places API instead — same
  photos, properly licensed, attribution string included.
- Use an AI image generator for real places. A plausible-looking Kangla Fort that is not
  Kangla Fort is worse than no photo, and on a tourism platform it is a trust problem,
  not an aesthetic one.
- Reuse the existing `public/file-uploads/` images without opening them first. Some of
  that library does not show Manipur at all.

## Files

| File | What |
|---|---|
| `scripts/harvest_commons_photos.py` | The harvester. Re-runnable; `--limit N` for a smoke test |
| `scripts/places_for_photos.json` | The 64 queried subjects and their search terms |
| `photos.json` | Candidates, with licence and attribution per image |
