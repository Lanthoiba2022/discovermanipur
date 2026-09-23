#!/usr/bin/env python3
"""
Second photo net: Openverse.

Wikimedia Commons tracks Wikipedia, not tourism, so it goes empty exactly where our
most interesting findings are — the Google Maps discoveries and the hidden gems.
Openverse indexes CC-licensed images across Flickr, Wikimedia, museums and others,
which reaches photographers who posted to Flickr and never touched Commons.

Same discipline as the Commons harvester:
  * commercial-use licences only (Openverse's own `license_type=commercial` filter,
    then a second check against our allow-list, because trusting one flag is how
    NC images end up on a live site)
  * candidates only — every image still gets opened by a human before use
  * attribution captured per image so the credit can be rendered

Run after harvest_commons_photos.py; this fills its gaps rather than replacing it.

Usage:
    python3 harvest_openverse_photos.py                 # subjects with <6 Commons hits
    python3 harvest_openverse_photos.py --all           # every subject
    python3 harvest_openverse_photos.py --min-needed 2  # only chase the true zeros
"""

import argparse
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://api.openverse.org/v1/images/"
UA = "YeningTourismResearch/1.0 (tourism platform dataset; contact via project maintainer)"

# Openverse licence codes we accept. "by" and "by-sa" need attribution, which we
# capture. cc0/pdm need none but we credit anyway.
ALLOWED = {"cc0", "pdm", "by", "by-sa"}
MIN_WIDTH = 700          # slightly below the Commons floor: Flickr originals run smaller
TARGET_PER_PLACE = 6

STOPWORDS = {
    "the", "of", "and", "in", "at", "a", "manipur", "india", "village",
    "temple", "lake", "hill", "park", "cave", "waterfall", "national",
}


def api(params, attempts=4):
    url = f"{API}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    delay = 2.0
    last = None
    for _ in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (429, 503):
                time.sleep(delay)
                delay *= 2
                continue
            if e.code == 400:      # bad query, not worth retrying
                return {"results": [], "result_count": 0}
            raise
        except Exception as e:
            last = e
            time.sleep(delay)
            delay *= 2
    raise last


def _dedupe_key(title, url):
    t = (title or "").lower().rsplit(".", 1)[0]
    t = re.sub(r"[\s_\-]*\(?\d{1,3}\)?$", "", t)
    t = re.sub(r"[^a-z0-9]+", " ", t).strip()
    return " ".join(t.split()[:8]) or (url or "")[-40:]


def _tag_names(raw):
    """Openverse returns tags as dicts on some records and bare strings on others."""
    out = []
    for t in raw or []:
        if isinstance(t, dict):
            n = t.get("name")
        else:
            n = t
        if n:
            out.append(str(n))
    return out


def relevance(c, place):
    """Same subject-vs-location logic as the Commons harvester."""
    title = (c.get("title") or "").lower()
    tags = " ".join(c.get("tags") or []).lower()

    tokens = {
        t for t in place["name"].lower().replace("(", " ").replace(")", " ").split()
        if len(t) > 3 and t not in STOPWORDS
    }
    if not tokens:
        tokens = {place["name"].lower()}

    score = sum(8 for t in tokens if t in title) + sum(2 for t in tokens if t in tags)
    bare = place["name"].split("(")[0].strip().lower()
    if bare in title:
        pos = title.index(bare) / max(len(title), 1)
        score += 30 if pos < 0.25 else (12 if pos < 0.55 else 2)
    return score


def to_candidate(x):
    lic = (x.get("license") or "").lower()
    ver = x.get("license_version") or ""
    w = x.get("width") or 0
    return {
        "title": x.get("title") or "",
        "url": x.get("url"),
        "thumb": x.get("thumbnail"),
        "foreign_landing_url": x.get("foreign_landing_url"),
        "width": w,
        "height": x.get("height") or 0,
        "licence": f"CC {lic.upper()} {ver}".strip(),
        "licence_code": lic,
        "licence_url": x.get("license_url"),
        "artist": x.get("creator") or "",
        "creator_url": x.get("creator_url"),
        "provider": x.get("provider"),
        "source": x.get("source"),
        "attribution": x.get("attribution") or "",
        "tags": _tag_names(x.get("tags"))[:8],
        "licence_acceptable": lic in ALLOWED,
        "big_enough": w >= MIN_WIDTH,
    }


def harvest(place, already_have=0):
    seen, picked, queries = set(), [], []
    for term in place["queries"]:
        try:
            d = api({
                "q": term,
                "license_type": "commercial",
                "page_size": "20",
                "mature": "false",
            })
        except Exception as e:
            queries.append({"term": term, "error": str(e)})
            continue
        results = d.get("results", []) or []
        queries.append({"term": term, "hits": len(results), "total": d.get("result_count")})
        for x in results:
            c = to_candidate(x)
            k = _dedupe_key(c["title"], c["url"])
            if k in seen:
                continue
            seen.add(k)
            c["found_by"] = term
            picked.append(c)
        usable = [c for c in picked
                  if c["licence_acceptable"] and c["big_enough"] and relevance(c, place) > 0]
        if len(usable) + already_have >= TARGET_PER_PLACE:
            break
        time.sleep(1.0)

    ok = [c for c in picked if c["licence_acceptable"] and c["big_enough"]]
    for c in ok:
        c["relevance"] = relevance(c, place)
    ok.sort(key=lambda c: (-c["relevance"], -c["width"]))
    likely = [c for c in ok if c["relevance"] > 0]
    weak = [c for c in ok if c["relevance"] <= 0]

    return {
        "slug": place["slug"],
        "name": place["name"],
        "queries_tried": queries,
        "likely_depicts_count": len(likely),
        "likely_depicts": likely[:10],
        "weak_match": weak[:4],
        "rejected_count": len(picked) - len(ok),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--places", default="places_for_photos.json")
    ap.add_argument("--commons", default="../photos.json")
    ap.add_argument("--out", default="../photos-openverse.json")
    ap.add_argument("--all", action="store_true", help="every subject, not just thin ones")
    ap.add_argument("--min-needed", type=int, default=TARGET_PER_PLACE,
                    help="only chase subjects whose Commons count is below this")
    args = ap.parse_args()

    here = Path(__file__).parent
    places = json.loads((here / args.places).read_text())

    commons_counts = {}
    cpath = here / args.commons
    if cpath.exists():
        for r in json.loads(cpath.read_text()).get("places", []):
            commons_counts[r["slug"]] = r.get("likely_depicts_count", 0)

    if not args.all:
        places = [p for p in places
                  if commons_counts.get(p["slug"], 0) < args.min_needed]

    print(f"chasing {len(places)} subjects on Openverse\n")
    results = []
    for i, p in enumerate(places, 1):
        have = commons_counts.get(p["slug"], 0)
        print(f"[{i}/{len(places)}] {p['name']}  (commons: {have})", flush=True)
        r = harvest(p, already_have=have)
        r["commons_count"] = have
        r["combined_count"] = have + r["likely_depicts_count"]
        results.append(r)
        time.sleep(1.2)

    gained = sum(1 for r in results if r["likely_depicts_count"] > 0)
    now_1plus = sum(1 for r in results if r["combined_count"] >= 1)
    now_2plus = sum(1 for r in results if r["combined_count"] >= 2)
    still_zero = [r["name"] for r in results if r["combined_count"] == 0]

    out = {
        "$meta": {
            "dataset": "manipur-place-photos-openverse",
            "collected": time.strftime("%Y-%m-%d"),
            "source": "Openverse API (aggregates Flickr, Wikimedia, museums and others)",
            "licences_accepted": sorted(ALLOWED),
            "min_width_px": MIN_WIDTH,
            "status": "CANDIDATES ONLY — open every image before use",
            "note": "Run as a second net after photos.json. combined_count = Commons + Openverse for that subject.",
            "coverage": {
                "subjects_chased": len(results),
                "gained_at_least_one": gained,
                "combined_1plus": now_1plus,
                "combined_2plus": now_2plus,
                "still_zero": still_zero,
            },
        },
        "places": results,
    }
    (here / args.out).write_text(json.dumps(out, indent=2, ensure_ascii=False))
    print(f"\ngained images for {gained}/{len(results)} | >=1: {now_1plus} | >=2: {now_2plus}")
    print(f"still zero ({len(still_zero)}): {', '.join(still_zero) or 'none'}")


if __name__ == "__main__":
    main()
