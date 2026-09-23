# Getting Google's place photos legitimately — Places API

You wanted Maps photos with a credit. Screenshotting them doesn't work legally, but
Google sells the licensed version of exactly that, and it is cheap and quick to wire up.

## Why the API is different from a screenshot

A screenshot copies a photographer's work off a page. The **Places API Photos** endpoint
serves you the same photos under Google's Terms of Service, which grant you the right to
display them in your app provided you show the required attribution. Google returns the
attribution string with each photo — `authorAttributions` — so the credit is handed to
you rather than invented.

This is the one route where "Google Maps photo + credit" is actually correct.

## What you need

1. A Google Cloud project with **Places API (New)** enabled.
2. An API key, referrer-restricted to your domain.
3. Billing on. Place Photos is billed per request; the free monthly credit covers a
   hackathon build comfortably. Check current pricing before a production launch.

## The two calls

**Find the place** (you already have exact names and addresses for every listing, so
matches will be reliable):

```
POST https://places.googleapis.com/v1/places:searchText
X-Goog-Api-Key: KEY
X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.photos

{ "textQuery": "Loktak Aquamarine Floating Homestay, Takmu, Manipur" }
```

Each entry in `places.photos` carries a `name` (the photo resource), `widthPx`,
`heightPx`, and `authorAttributions` — **that last field is the credit you must render.**

**Fetch the image:**

```
GET https://places.googleapis.com/v1/{photo.name}/media
      ?maxWidthPx=1200&key=KEY&skipHttpRedirect=true
```

Returns a `photoUri`. Typically 3–10 photos per established place, which covers your
5–6 target for the businesses — homestays, cafés, hotels — where Commons has nothing.

## The rules that come with it

- **Show the attribution.** `authorAttributions` gives a name and a URI; render both.
  Dropping it breaks the terms.
- **Don't cache the image.** Google's terms allow caching the place `id` but not the
  photo bytes. Fetch via the API at render time — so this is a runtime integration, not
  a scrape-once-into-`public/` job. Plan the component accordingly.
- **Don't feed them to an image model** or use them outside the app.

## How I'd split it

Commons and the Places API cover different halves of the problem, and they don't
overlap much:

| Content | Source |
|---|---|
| Landscapes, monuments, festivals, crafts, wildlife | **Wikimedia Commons** — `photos.json`. You own the copy, can cache and optimise it, and it's free |
| Homestays, cafés, restaurants, hotels, rentals | **Places API** — runtime fetch with attribution. Commons will never have these |
| Hidden gems with neither | **Commission locally** — see `PHOTOS.md` |

That's a clean division: Commons for the places, Places API for the businesses.

## Faster fallbacks if you want something on screen today

- **Openverse** (`api.openverse.org`) — aggregates CC-licensed images across Flickr and
  others, one API, licence returned per result. Wider net than Commons alone.
- **Flickr** with `license=1,2,4,5,9,10` — CC-only filter. Manipur coverage from
  travelling photographers is better than you'd expect.
- **Unsplash / Pexels** — free for commercial use, no attribution required. Won't have
  Manipuri subjects, but fine for generic texture behind text.
- **The businesses themselves.** A homestay host will send you photos same-day and be
  pleased you asked. Put the licence grant in the onboarding form and the problem solves
  itself permanently.
