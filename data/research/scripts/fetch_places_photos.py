#!/usr/bin/env python3
"""
Google Places API (New) — photo references + attribution for every listing.

This is the licensed route to the photos you see on Google Maps. Screenshotting those
is infringement; calling this endpoint is not, because Google's terms grant the right
to display them in your app provided the supplied attribution is shown.

WHAT THIS STORES, AND WHY IT STOPS WHERE IT DOES
------------------------------------------------
Google's terms let you cache a place `id` indefinitely, but NOT the image bytes. So this
script deliberately stores only:

    place_id, photo resource name, dimensions, authorAttributions

and never downloads an image. The app resolves a photo at render time:

    GET https://places.googleapis.com/v1/{photo_name}/media?maxWidthPx=1200&key=KEY

That makes photos a runtime integration, not a build-time asset dump. Budget a small
server-side cache of the *resolved URL* (short TTL), never of the file.

Every photo carries `authorAttributions` — a display name and a URI for the person who
took it. Rendering that is a condition of use, not a courtesy.

Usage:
    python3 fetch_places_photos.py --dry-run     # 5 subjects, prints what it finds
    python3 fetch_places_photos.py               # everything
"""

import argparse
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

SEARCH = "https://places.googleapis.com/v1/places:searchText"
UA = "YeningTourismResearch/1.0"
FIELDS = ",".join([
    "places.id", "places.displayName", "places.formattedAddress",
    "places.location", "places.rating", "places.userRatingCount",
    "places.primaryTypeDisplayName", "places.photos",
])


def load_key(env_path):
    """Read GOOGLE_API_KEY out of .env.local. Never printed, never written to output."""
    key = os.environ.get("GOOGLE_API_KEY")
    if key:
        return key.strip()
    p = Path(env_path)
    if p.exists():
        for line in p.read_text().splitlines():
            if line.startswith("GOOGLE_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("GOOGLE_API_KEY not found — set it in the environment or .env.local")


def search_place(query, key, attempts=4):
    body = json.dumps({"textQuery": query, "maxResultCount": 1}).encode()
    req = urllib.request.Request(
        SEARCH, data=body, method="POST",
        headers={
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": FIELDS,
            "Content-Type": "application/json",
            "User-Agent": UA,
        },
    )
    delay = 2.0
    for _ in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            if e.code in (429, 503):
                time.sleep(delay)
                delay *= 2
                continue
            detail = e.read().decode()[:200]
            return {"_error": f"HTTP {e.code}: {detail}"}
        except Exception as e:
            time.sleep(delay)
            delay *= 2
    return {"_error": "exhausted retries"}


def shape(place, wanted_name):
    photos = []
    for ph in place.get("photos", [])[:10]:
        attrs = [
            {"name": a.get("displayName"), "uri": a.get("uri"),
             "photo_uri": a.get("photoUri")}
            for a in ph.get("authorAttributions", [])
        ]
        photos.append({
            "photo_name": ph.get("name"),          # pass to /media at render time
            "width": ph.get("widthPx"),
            "height": ph.get("heightPx"),
            "author_attributions": attrs,          # MUST be rendered
        })
    got = (place.get("displayName") or {}).get("text", "")
    # Loose sanity check that Google matched what we asked for.
    a = re.sub(r"[^a-z0-9]+", " ", wanted_name.lower()).split()
    b = re.sub(r"[^a-z0-9]+", " ", got.lower())
    overlap = sum(1 for t in a if len(t) > 3 and t in b)
    return {
        "matched_name": got,
        "place_id": place.get("id"),
        "address": place.get("formattedAddress"),
        "location": place.get("location"),
        "rating": place.get("rating"),
        "rating_count": place.get("userRatingCount"),
        "type": (place.get("primaryTypeDisplayName") or {}).get("text"),
        "photo_count": len(photos),
        "photos": photos,
        "match_confidence": "high" if overlap >= 2 else ("medium" if overlap == 1 else "low"),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--subjects", default="places_api_subjects.json")
    ap.add_argument("--env", default="../../../.env.local")
    ap.add_argument("--out", default="../photos-google-places.json")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    here = Path(__file__).parent
    key = load_key(here / args.env)
    subjects = json.loads((here / args.subjects).read_text())
    if args.dry_run:
        subjects = subjects[:5]

    results, failed = [], []
    for i, s in enumerate(subjects, 1):
        print(f"[{i}/{len(subjects)}] {s['name']}", flush=True)
        d = search_place(s["query"], key)
        if "_error" in d:
            failed.append({**s, "error": d["_error"]})
            continue
        places = d.get("places") or []
        if not places:
            failed.append({**s, "error": "no match"})
            continue
        r = shape(places[0], s["name"])
        results.append({"slug": s["slug"], "name": s["name"],
                        "category": s.get("category"), "query": s["query"], **r})
        time.sleep(0.25)

    with_photos = [r for r in results if r["photo_count"] > 0]
    ge2 = [r for r in results if r["photo_count"] >= 2]
    ge6 = [r for r in results if r["photo_count"] >= 6]
    low = [r for r in results if r["match_confidence"] == "low"]

    out = {
        "$meta": {
            "dataset": "manipur-photos-google-places",
            "collected": time.strftime("%Y-%m-%d"),
            "source": "Google Places API (New) — places:searchText",
            "licence": "Google Maps Platform Terms of Service. Photos may be displayed in the app; authorAttributions MUST be rendered with each photo.",
            "storage_rule": "place_id and photo resource names are cacheable. IMAGE BYTES ARE NOT. Resolve each photo at render time via /v1/{photo_name}/media.",
            "render_url": "https://places.googleapis.com/v1/{photo_name}/media?maxWidthPx=1200&key=YOUR_KEY",
            "coverage": {
                "subjects": len(subjects),
                "matched": len(results),
                "with_at_least_1_photo": len(with_photos),
                "with_at_least_2_photos": len(ge2),
                "with_6_or_more": len(ge6),
                "low_confidence_matches": len(low),
                "failed": len(failed),
            },
            "review_required": "Entries with match_confidence 'low' or 'medium' may be the wrong place — Google matched something, but not necessarily what was asked for. Check before publishing.",
        },
        "places": results,
        "failed": failed,
    }
    (here / args.out).write_text(json.dumps(out, indent=2, ensure_ascii=False))
    print(f"\nmatched {len(results)}/{len(subjects)} | >=1 photo: {len(with_photos)} "
          f"| >=2: {len(ge2)} | >=6: {len(ge6)} | low-confidence: {len(low)} | failed: {len(failed)}")


if __name__ == "__main__":
    main()
