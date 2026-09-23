#!/usr/bin/env python3
"""
Harvest candidate photographs for Manipur places from Wikimedia Commons.

Why Commons and nothing else: this is a production tourism platform. Google Maps
photos, TripAdvisor photos and images lifted off blogs are owned by the people who
took them, and republishing them is infringement regardless of whether a credit is
shown. Commons files carry an explicit reuse licence and the metadata needed to
honour it. The project already works this way — see src/lib/data/photo-credits.ts.

This script only ever produces CANDIDATES. Two reasons nothing here is publishable
as-is:

  1. Commons files are routinely filed under a subject they do not depict. The
     existing photo-credits.ts says so in its header, and the project has already
     been bitten by it. Every candidate must be opened and looked at.
  2. Some permissive licences still impose conditions (share-alike, attribution
     text, no implication of endorsement). The licence string is captured per file
     so a human can decide.

Usage:
    python3 harvest_commons_photos.py            # all places
    python3 harvest_commons_photos.py --limit 5  # smoke test
"""

import argparse
import json
import re
import time
import urllib.parse
import urllib.error
import urllib.request
from pathlib import Path

API = "https://commons.wikimedia.org/w/api.php"
UA = "YeningTourismResearch/1.0 (tourism platform dataset; contact via project maintainer)"

# Licences we will consider. Anything outside this set is dropped rather than
# guessed at — "no licence template found" is not the same as "free to use".
ALLOWED = (
    "cc0", "public domain", "cc by", "cc-by", "cc by-sa", "cc-by-sa",
)
# Explicitly refuse these even though Commons hosts them.
REFUSED = ("non-free", "fair use", "nc", "noncommercial", "nd", "noderivs")

TARGET_PER_PLACE = 6
MIN_WIDTH = 800  # below this it is not usable as a hero or card image


def api(params, attempts=5):
    """
    Commons rate-limits hard and answers 429 without a Retry-After. A first run of
    this script lost 48 of 64 places to 429s that were silently recorded as "no
    photos found" — which looked like a real finding and was not. Back off and retry.
    """
    params = {**params, "format": "json", "formatversion": "2"}
    url = f"{API}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    delay = 2.0
    last = None
    for _ in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=45) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (429, 503):
                time.sleep(delay)
                delay *= 2
                continue
            raise
        except Exception as e:
            last = e
            time.sleep(delay)
            delay *= 2
    raise last


def _meta(extmeta, key):
    v = extmeta.get(key, {}).get("value", "")
    # extmetadata values arrive as HTML fragments
    import re
    return re.sub(r"<[^>]+>", "", v).strip()


def licence_ok(lic):
    low = lic.lower()
    if any(bad in low.split() or bad in low for bad in REFUSED):
        # guard against "CC BY-NC" slipping through on the "cc by" prefix
        if "nc" in low or "non" in low or "nd" in low.split("-"):
            return False
    return any(good in low for good in ALLOWED)


def pages_to_candidates(pages):
    out = []
    for p in pages or []:
        ii = (p.get("imageinfo") or [{}])[0]
        if not ii:
            continue
        em = ii.get("extmetadata", {}) or {}
        lic = _meta(em, "LicenseShortName") or _meta(em, "License")
        width = ii.get("width", 0)
        mime = ii.get("mime", "")
        if not mime.startswith("image/") or mime == "image/svg+xml":
            continue
        out.append({
            "title": p.get("title", "").replace("File:", ""),
            "descriptionurl": ii.get("descriptionurl"),
            "url": ii.get("url"),
            "thumb": ii.get("thumburl"),
            "width": width,
            "height": ii.get("height", 0),
            "mime": mime,
            "licence": lic,
            "artist": _meta(em, "Artist"),
            "credit": _meta(em, "Credit"),
            "date": _meta(em, "DateTimeOriginal"),
            "caption": (_meta(em, "ImageDescription") or "")[:400],
            "licence_acceptable": licence_ok(lic),
            "big_enough": width >= MIN_WIDTH,
        })
    return out


def search(term, limit=25):
    try:
        d = api({
            "action": "query", "generator": "search",
            "gsrsearch": f'filetype:bitmap {term}',
            "gsrnamespace": "6", "gsrlimit": str(limit),
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
            "iiurlwidth": "400",
        })
        return pages_to_candidates(d.get("query", {}).get("pages"))
    except Exception as e:
        return {"error": str(e)}


def geosearch(lat, lng, radius=3000, limit=25):
    try:
        d = api({
            "action": "query", "generator": "geosearch",
            "ggscoord": f"{lat}|{lng}", "ggsradius": str(radius),
            "ggsnamespace": "6", "ggslimit": str(limit),
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
            "iiurlwidth": "400",
        })
        return pages_to_candidates(d.get("query", {}).get("pages"))
    except Exception as e:
        return {"error": str(e)}


STOPWORDS = {
    "the", "of", "and", "in", "at", "a", "manipur", "india", "village",
    "temple", "lake", "hill", "park", "cave", "waterfall", "national",
}


def _dedupe_key(title):
    """
    Commons carries the same shot uploaded several times with a trailing counter
    or a near-identical name. Collapse those so one subject cannot fill all six
    slots on a place page.
    """
    t = title.lower().rsplit(".", 1)[0]
    t = re.sub(r"[\s_\-]*\(?\d{1,3}\)?$", "", t)   # trailing " (2)", "_03"
    t = re.sub(r"[^a-z0-9]+", " ", t).strip()
    return " ".join(t.split()[:8])


def relevance(candidate, place):
    """
    How likely is this file to actually DEPICT the place, rather than merely have
    been taken at it?

    Commons search matches the whole file page, so "Kangla Fort" returns a silky
    oak that happens to grow inside Kangla, and "Loktak Lake" returns a rubythroat
    photographed beside it. Both are correctly filed and neither is a picture of
    the place.

    The tell is WHERE the place name sits in the title. Commons titles lead with
    the subject and trail with the location, so "Kangla Fort, Imphal.JPG" is a
    photo of the fort while "Chinese Rubythroat ... Loktak Lake" is a photo of a
    bird. Score position, not just presence.
    """
    title = (candidate["title"] or "").lower()
    caption = (candidate["caption"] or "").lower()

    tokens = {
        t for t in place["name"].lower().replace("(", " ").replace(")", " ").split()
        if len(t) > 3 and t not in STOPWORDS
    }
    if not tokens:
        tokens = {place["name"].lower()}

    in_title = sum(1 for t in tokens if t in title)
    in_caption = sum(1 for t in tokens if t in caption)
    score = in_title * 8 + in_caption * 2

    bare = place["name"].split("(")[0].strip().lower()
    if bare in title:
        pos = title.index(bare) / max(len(title), 1)
        # Leading = the place is the subject. Trailing = it is just where the
        # photographer was standing.
        score += 30 if pos < 0.25 else (12 if pos < 0.55 else 2)
    elif in_title:
        first = min((title.index(t) for t in tokens if t in title), default=len(title))
        if first / max(len(title), 1) < 0.25:
            score += 10

    if candidate.get("found_by") == "geosearch" and score == 0:
        score = -5
    return score


def harvest(place):
    """Try the most specific query first, widen only if short."""
    seen, picked, queries = set(), [], []

    for term in place["queries"]:
        res = search(term)
        queries.append({"term": term, "hits": len(res) if isinstance(res, list) else res})
        if not isinstance(res, list):
            continue
        for c in res:
            if c["title"] in seen:
                continue
            seen.add(c["title"])
            c["found_by"] = term
            picked.append(c)
        interim = [c for c in picked if c["licence_acceptable"] and c["big_enough"]
                   and relevance(c, place) > 0]
        if len(interim) >= TARGET_PER_PLACE:
            break
        time.sleep(1.2)

    if place.get("coords"):
        lat, lng = place["coords"]
        res = geosearch(lat, lng)
        queries.append({"term": f"geo:{lat},{lng}", "hits": len(res) if isinstance(res, list) else res})
        if isinstance(res, list):
            for c in res:
                if c["title"] not in seen:
                    seen.add(c["title"])
                    c["found_by"] = "geosearch"
                    picked.append(c)

    licensed = [c for c in picked if c["licence_acceptable"] and c["big_enough"]]
    for c in licensed:
        c["relevance"] = relevance(c, place)
    licensed.sort(key=lambda c: (-c["relevance"], -c["width"]))

    deduped, seen_keys = [], set()
    for c in licensed:
        k = _dedupe_key(c["title"])
        if k in seen_keys:
            continue
        seen_keys.add(k)
        deduped.append(c)
    dropped_dupes = len(licensed) - len(deduped)
    licensed = deduped

    # Only files whose own title or caption names the place are treated as likely
    # depictions. The rest are kept separately as "nearby, subject unconfirmed" —
    # useful for atmosphere shots, but never to be dropped onto a place page unseen.
    likely = [c for c in licensed if c["relevance"] > 0]
    nearby = [c for c in licensed if c["relevance"] <= 0]
    rejected = [c for c in picked if not (c["licence_acceptable"] and c["big_enough"])]

    return {
        "slug": place["slug"],
        "name": place["name"],
        "queries_tried": queries,
        "likely_depicts_count": len(likely),
        "meets_target": len(likely) >= TARGET_PER_PLACE,
        "likely_depicts": likely[:12],
        "nearby_subject_unconfirmed": nearby[:6],
        "rejected_count": len(rejected),
        "duplicates_collapsed": dropped_dupes,
        "rejected_reasons": {
            "licence": sum(1 for c in rejected if not c["licence_acceptable"]),
            "too_small": sum(1 for c in rejected if not c["big_enough"]),
        },
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--places", default="places_for_photos.json")
    ap.add_argument("--out", default="../photos.json")
    ap.add_argument("--resume", action="store_true",
                    help="keep places that completed without API errors, redo the rest")
    args = ap.parse_args()

    here = Path(__file__).parent
    places = json.loads((here / args.places).read_text())
    if args.limit:
        places = places[: args.limit]

    prior = {}
    out_path = here / args.out
    if args.resume and out_path.exists():
        for r in json.loads(out_path.read_text()).get("places", []):
            errored = any(isinstance(q.get("hits"), dict) for q in r.get("queries_tried", []))
            if not errored:
                prior[r["slug"]] = r
        print(f"resuming: {len(prior)} places already clean, redoing {len(places)-len(prior)}")

    results = []
    for i, p in enumerate(places, 1):
        if p["slug"] in prior:
            results.append(prior[p["slug"]])
            continue
        print(f"[{i}/{len(places)}] {p['name']}", flush=True)
        results.append(harvest(p))
        time.sleep(1.5)

    met = sum(1 for r in results if r["meets_target"])
    some = sum(1 for r in results if 0 < r["likely_depicts_count"] < TARGET_PER_PLACE)
    none_ = sum(1 for r in results if r["likely_depicts_count"] == 0)

    out = {
        "$meta": {
            "dataset": "manipur-place-photos",
            "collected": time.strftime("%Y-%m-%d"),
            "source": "Wikimedia Commons API",
            "target_per_place": TARGET_PER_PLACE,
            "min_width_px": MIN_WIDTH,
            "licences_accepted": list(ALLOWED),
            "status": "CANDIDATES ONLY — NOT CLEARED FOR PUBLICATION",
            "mandatory_before_use": [
                "Open every image. Commons files are frequently filed under a subject they do not depict; photo-credits.ts already warns about this and the project has been caught by it before.",
                "Re-read the licence on the file page itself. The API's LicenseShortName is a summary, not the licence.",
                "Record artist + licence + file-page URL in src/lib/data/photo-credits.ts, matching the existing PhotoCredit shape.",
                "Resize and convert to WebP as the existing pipeline does.",
            ],
            "coverage": {
                "places_queried": len(results),
                "met_target_of_6": met,
                "partial_1_to_5": some,
                "nothing_found": none_,
                "ranking_note": "likely_depicts = the file's own title or caption names the place. nearby_subject_unconfirmed = licensed and in the right area, but nothing says what it shows. Never publish from the second list without opening it.",
            },
        },
        "places": results,
    }
    (here / args.out).write_text(json.dumps(out, indent=2, ensure_ascii=False))
    print(f"\n{met} met target / {some} partial / {none_} empty  →  {args.out}")


if __name__ == "__main__":
    main()
