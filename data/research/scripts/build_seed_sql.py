#!/usr/bin/env python3
"""
Turn the 2026 research datasets into idempotent seed SQL.

Design rules, in order of importance:

  1. NEVER touch an existing row. Every statement is an INSERT ... ON CONFLICT
     (slug) DO NOTHING. A slug that already exists is left exactly as it is —
     if the original seed already has `loktak-lake`, this will not overwrite it.
     That is what "keep the existing data as it is" has to mean at the SQL level.

  2. New rows get sort_weight = 100 so they lead the UI; the original seed stays
     at the column default of 0 and follows.

  3. Only emit a row we can actually satisfy the schema with. `district` and
     `category` are Postgres enums and `lat`/`lng` are NOT NULL, so a record
     without a confident district or real coordinates is skipped and reported
     rather than defaulted into the database. A wrong pin is worse than no row.

  4. Google Places photos go in `photo_refs` (resolved at request time), never in
     `images` (files we host). Storing the bytes would breach the Maps terms.

Usage:
    python3 build_seed_sql.py            # writes ../../db/research-seed/0008_seed_2026_research.sql

Writing the file applies nothing. See db/README.md for loading it into a
database (`psql "$DATABASE_URL" -f ...`).
"""

import json
import re
from pathlib import Path

HERE = Path(__file__).parent
RESEARCH = HERE.parent
OUT = RESEARCH.parent.parent / "db" / "research-seed" / "0008_seed_2026_research.sql"

WEIGHT = 100

DISTRICTS = {
    "Imphal East", "Imphal West", "Bishnupur", "Thoubal", "Kakching",
    "Churachandpur", "Ukhrul", "Senapati", "Tamenglong", "Chandel",
    "Jiribam", "Kamjong", "Noney", "Pherzawl", "Tengnoupal", "Kangpokpi",
}
CATEGORIES = {
    "lake", "hill", "heritage", "wildlife", "waterfall", "temple",
    "museum", "market", "village", "memorial", "cave", "park",
}
# Research categories -> schema enum. Anything unmapped is reported, not guessed.
CAT_MAP = {
    "heritage": "heritage", "culture": "heritage", "craft": "heritage",
    "nature": "park", "garden": "park", "park": "park", "agri-tourism": "park",
    "lake": "lake", "waterfall": "waterfall", "cave": "cave",
    "temple": "temple", "village": "village", "museum": "museum",
    "war-history": "memorial", "landmark": "memorial", "adventure": "hill",
    "activity": "park", "viewpoint": "hill", "hill": "hill",
}

# Manipur PIN prefixes that map unambiguously to one district. Deliberately a
# short list: a wrong district is a wrong filter, a wrong map cluster and a wrong
# "near you", so anything I could not pin down is left out and the row is skipped.
PIN_DISTRICT = {
    "795001": "Imphal West", "795003": "Imphal West", "795004": "Imphal West",
    "795008": "Imphal West", "795140": "Imphal West",
    "795002": "Imphal East", "795005": "Imphal East", "795010": "Imphal East",
    "795133": "Bishnupur", "795126": "Bishnupur",
    "795142": "Ukhrul", "795145": "Ukhrul",
    "795128": "Churachandpur", "795159": "Churachandpur",
    "795138": "Thoubal", "795103": "Thoubal",
    "795106": "Senapati", "795150": "Senapati",
}

# Localities, checked before the PIN list — a named village beats a postcode.
LOCALITY_DISTRICT = {
    "heingang": "Imphal East", "waiton": "Imphal East", "sanjenbam": "Imphal East",
    "pheidinga": "Imphal East", "khunkhu naga": "Imphal East", "andro": "Imphal East",
    "lamlai": "Imphal East", "nongmaiching": "Imphal East",
    "malom": "Imphal West", "taobungkhok": "Imphal West", "sekmai": "Imphal West",
    "lamphel": "Imphal West", "langol": "Imphal West",
    "thanga": "Bishnupur", "kha thingungei": "Bishnupur", "keibul": "Bishnupur",
    "loktak": "Bishnupur", "sendra": "Bishnupur", "takmu": "Bishnupur",
    "hungpung": "Ukhrul", "khangkhui": "Ukhrul", "louphong": "Ukhrul",
    "phungreitang": "Ukhrul", "viewland": "Ukhrul", "talui": "Ukhrul",
    "kharam vaiphei": "Churachandpur", "thangjing chiru": "Churachandpur",
    "lamka": "Churachandpur", "tedim": "Churachandpur",
    "makhan": "Senapati", "maram": "Senapati", "tadubi": "Senapati",
    "purul": "Senapati", "paomata": "Senapati",
}

# Districts inferred from a place's own text where the dataset left it implicit.
DISTRICT_HINTS = [
    ("imphal west", "Imphal West"), ("imphal east", "Imphal East"),
    ("ukhrul", "Ukhrul"), ("senapati", "Senapati"), ("bishnupur", "Bishnupur"),
    ("churachandpur", "Churachandpur"), ("lamka", "Churachandpur"),
    ("tamenglong", "Tamenglong"), ("noney", "Noney"), ("chandel", "Chandel"),
    ("thoubal", "Thoubal"), ("kakching", "Kakching"), ("kamjong", "Kamjong"),
    ("jiribam", "Jiribam"), ("kangpokpi", "Kangpokpi"), ("pherzawl", "Pherzawl"),
    ("tengnoupal", "Tengnoupal"), ("moreh", "Tengnoupal"), ("moirang", "Bishnupur"),
    ("imphal", "Imphal West"),
]


def q(v):
    """SQL literal. None -> NULL."""
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def qj(obj):
    return "'" + json.dumps(obj, ensure_ascii=False).replace("'", "''") + "'::jsonb"


def qarr(items):
    if not items:
        return "'{}'"
    inner = ",".join('"' + str(i).replace("\\", "\\\\").replace('"', '\\"') + '"' for i in items)
    return "'{" + inner + "}'"


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:60]


def guess_district(*texts):
    blob = " ".join(t for t in texts if t).lower()
    for needle, d in LOCALITY_DISTRICT.items():
        if needle in blob:
            return d
    for pin, d in PIN_DISTRICT.items():
        if pin in blob:
            return d
    for needle, d in DISTRICT_HINTS:
        if needle in blob:
            return d
    return None


def load(name):
    return json.loads((RESEARCH / name).read_text())


def main():
    gp = {p["slug"]: p for p in load("photos-google-places.json")["places"]}
    commons = {p["slug"]: p for p in load("photos.json")["places"]}

    def photo_refs(slug):
        p = gp.get(slug)
        if not p:
            return []
        return [{
            "provider": "google-places",
            "ref": ph["photo_name"],
            "width": ph.get("width"),
            "height": ph.get("height"),
            "attribution": [
                {"name": a.get("name"), "uri": a.get("uri")}
                for a in ph.get("author_attributions", [])
            ],
        } for ph in p.get("photos", [])[:8]]

    def coords(slug):
        """
        Coordinates only from a match we trust.

        A 'low' confidence match means Google returned SOMETHING for the query and
        its name shares nothing with what we asked for — the retry pass produced
        'Zeiladzang Village' -> 'Zeilad Lake' and 'Kaihlam Caves' -> 'Khangkhui
        Mangsor Cave', which are different places in different districts. Seeding
        those coordinates would put a confident-looking pin on the wrong valley,
        so refuse them and let the row be skipped.
        """
        p = gp.get(slug)
        if not p or not p.get("location"):
            return None
        if p.get("match_confidence") == "low":
            return None
        return p["location"]["latitude"], p["location"]["longitude"]

    lines, skipped = [], []

    # ------------------------------------------------------------- hotspots --
    hs_rows = []
    places = load("places.json")["places"]
    for pl in places:
        slug = pl["slug"]
        c = coords(slug)
        if not c:
            skipped.append(("hotspot", pl["name"],
                            "low-confidence match — wrong place"
                            if gp.get(slug, {}).get("match_confidence") == "low"
                            else "no coordinates"))
            continue
        cat = CAT_MAP.get(pl.get("category", ""))
        if not cat:
            skipped.append(("hotspot", pl["name"], f"unmapped category {pl.get('category')!r}"))
            continue
        district = pl.get("district") if pl.get("district") in DISTRICTS else guess_district(
            pl.get("district"), pl.get("location"), pl.get("name"))
        if not district:
            skipped.append(("hotspot", pl["name"], "no district"))
            continue
        gpp = gp.get(slug, {})
        hs_rows.append({
            "slug": slug, "name": pl["name"],
            "meitei_name": (pl.get("alt_names") or [None])[0],
            "tagline": pl.get("tagline") or pl["name"],
            "description": pl.get("description") or "",
            "history": pl.get("notes"),
            "category": cat, "district": district,
            "location": pl.get("location") or gpp.get("address") or pl["name"],
            "lat": c[0], "lng": c[1],
            "images": [], "photo_refs": photo_refs(slug),
            "best_time": pl.get("best_time"),
            "best_seasons": pl.get("best_seasons") or [],
            "entry_fee": pl.get("entry_fee"), "timings": pl.get("timings"),
            "how_to_reach": pl.get("how_to_reach") or "",
            "distance_km": 0, "duration_hours": 2,
            "tips": pl.get("tips") or [],
            "accessibility": {"wheelchairAccessible": False, "notes": ""},
            "tags": pl.get("tags") or [],
            "featured": bool(pl.get("hidden_gem")),
            "verification": pl.get("verification") or "unverified",
            "sources": pl.get("sources") or [],
        })

    # Google Maps discoveries
    for it in load("google-maps-findings.json")["new_places"]["items"]:
        slug = slugify(it["name"])
        if any(r["slug"] == slug for r in hs_rows):
            continue
        c = coords(slug)
        if not c:
            skipped.append(("hotspot", it["name"], "no coordinates"))
            continue
        gpp = gp.get(slug, {})
        cat = CAT_MAP.get((it.get("category") or "").split("/")[0].strip().lower(), "park")
        district = guess_district(gpp.get("address"), it.get("address"), it["name"])
        if not district:
            skipped.append(("hotspot", it["name"], "no district"))
            continue
        hs_rows.append({
            "slug": slug, "name": it["name"], "meitei_name": None,
            "tagline": it.get("note", "")[:180] or it["name"],
            "description": it.get("note") or f"{it['name']}, {district}.",
            "history": None, "category": cat, "district": district,
            "location": gpp.get("address") or it.get("address") or it["name"],
            "lat": c[0], "lng": c[1],
            "images": [], "photo_refs": photo_refs(slug),
            "best_time": None, "best_seasons": [],
            "entry_fee": it.get("entry_fee"), "timings": it.get("hours"),
            "how_to_reach": "", "distance_km": 0, "duration_hours": 2,
            "tips": [], "accessibility": {"wheelchairAccessible": False, "notes": ""},
            "tags": ["2026-research", "google-maps-discovery"],
            "featured": it.get("priority") == "high",
            "verification": "single-source",
            "sources": ["https://maps.google.com/"],
        })

    for r in hs_rows:
        lines.append(
            "insert into public.hotspots (slug,name,meitei_name,tagline,description,history,"
            "category,district,location,lat,lng,images,photo_refs,best_time,best_seasons,entry_fee,"
            "timings,how_to_reach,distance_km,duration_hours,tips,accessibility,tags,featured,"
            "sort_weight,verification,sources) values ("
            f"{q(r['slug'])},{q(r['name'])},{q(r['meitei_name'])},{q(r['tagline'])},"
            f"{q(r['description'])},{q(r['history'])},{q(r['category'])},{q(r['district'])},"
            f"{q(r['location'])},{r['lat']},{r['lng']},{qj(r['images'])},{qj(r['photo_refs'])},"
            f"{q(r['best_time'])},{qarr(r['best_seasons'])},{q(r['entry_fee'])},{q(r['timings'])},"
            f"{q(r['how_to_reach'])},{r['distance_km']},{r['duration_hours']},{qarr(r['tips'])},"
            f"{qj(r['accessibility'])},{qarr(r['tags'])},{q(r['featured'])},{WEIGHT},"
            f"{q(r['verification'])},{qj(r['sources'])}"
            ") on conflict (slug) do nothing;"
        )

    # ------------------------------------------------------------ homestays --
    hm_rows = []
    stays = load("stays.json")
    imphal = load("imphal-deep-dive.json")["imphal_homestays"]["items"]
    gmstays = load("google-maps-findings.json")["new_stays"]
    cand = (
        [(h["slug"], h["title"], h, "research") for h in stays["homestays"]]
        + [(slugify(h["name"]), h["name"], h, "maps")
           for h in gmstays["loktak_floating_stays"] + gmstays["other_new_stays"]]
        + [(slugify(h["name"]), h["name"], h, "maps") for h in imphal]
    )
    for slug, title, h, origin in cand:
        if any(r["slug"] == slug for r in hm_rows):
            continue
        c = coords(slug)
        gpp = gp.get(slug, {})
        if not c:
            skipped.append(("homestay", title, "no coordinates"))
            continue
        district = h.get("district") if h.get("district") in DISTRICTS else guess_district(
            h.get("district"), h.get("location"), gpp.get("address"), title)
        if not district:
            skipped.append(("homestay", title, "no district"))
            continue
        tariff = h.get("tariff") or {}
        price = (tariff.get("classic_room") or tariff.get("solo_occupancy")
                 or tariff.get("per_person_per_night_with_meals") or 0)
        if not price and h.get("indicative_rate"):
            m = re.search(r"[\d,]+", str(h["indicative_rate"]))
            price = int(m.group().replace(",", "")) if m else 0
        hm_rows.append({
            "slug": slug, "title": title,
            "description": h.get("note") or h.get("notes") or f"{title}, {district}.",
            "host_name": h.get("host_name") or "Host details to be confirmed",
            "host_story": h.get("notes") if origin == "research" else None,
            "location": h.get("location") or gpp.get("address") or district,
            "district": district, "lat": c[0], "lng": c[1],
            "price_per_night": int(price or 0),
            "max_guests": int(h.get("max_guests") or 4),
            "bedrooms": int(h.get("rooms") or 1), "bathrooms": 1,
            "amenities": [], "images": [], "photo_refs": photo_refs(slug),
            "rating": float(h.get("rating") or gpp.get("rating") or 0),
            "review_count": int(h.get("reviews") or gpp.get("rating_count") or 0),
            "house_rules": [], "cancellation_policy": None,
            "featured": h.get("priority") in ("high", "highest"),
            "verification": h.get("verification") or "single-source",
            "sources": h.get("sources") or ["https://maps.google.com/"],
        })

    for r in hm_rows:
        lines.append(
            "insert into public.homestays (slug,title,description,host_name,host_story,location,"
            "district,lat,lng,price_per_night,max_guests,bedrooms,bathrooms,amenities,images,"
            "photo_refs,rating,review_count,house_rules,cancellation_policy,featured,sort_weight,"
            "verification,sources) values ("
            f"{q(r['slug'])},{q(r['title'])},{q(r['description'])},{q(r['host_name'])},"
            f"{q(r['host_story'])},{q(r['location'])},{q(r['district'])},{r['lat']},{r['lng']},"
            f"{r['price_per_night']},{r['max_guests']},{r['bedrooms']},{r['bathrooms']},"
            f"{qarr(r['amenities'])},{qj(r['images'])},{qj(r['photo_refs'])},{r['rating']},"
            f"{r['review_count']},{qarr(r['house_rules'])},{q(r['cancellation_policy'])},"
            f"{q(r['featured'])},{WEIGHT},{q(r['verification'])},{qj(r['sources'])}"
            ") on conflict (slug) do nothing;"
        )

    # ------------------------------------------------------------- eateries --
    et_rows = []
    e = load("eateries.json")
    src = [(it["slug"], it, "Imphal West") for it in e["imphal"]["items"] if it.get("status") == "open"]
    src += [(it["slug"], it, "Ukhrul") for it in e["ukhrul"]["items"]]
    gmE = load("google-maps-findings.json")["eateries_by_district"]
    dmap = {"churachandpur_lamka": "Churachandpur", "ukhrul": "Ukhrul",
            "senapati": "Senapati", "moirang_loktak_bishnupur": "Bishnupur"}
    for k, v in gmE.items():
        if isinstance(v, dict) and "items" in v:
            for it in v["items"]:
                src.append((slugify(it["name"]) + "-" + k[:6], it, dmap[k]))
    for it in load("imphal-deep-dive.json")["new_imphal_eateries"]:
        src.append((slugify(it["name"]), it, "Imphal West"))

    for slug, it, district in src:
        if any(r["slug"] == slug for r in et_rows):
            continue
        c = coords(slug)
        gpp = gp.get(slug, {})
        if not c:
            skipped.append(("eatery", it.get("name", slug), "no coordinates"))
            continue
        pr = it.get("price_range")
        if not pr:
            band = str(it.get("price") or "")
            pr = 1 if "1–" in band or "1-" in band else (3 if "1,2" in band or "1,4" in band else 2)
        et_rows.append({
            "slug": slug, "name": it["name"],
            "description": it.get("note") or it.get("notes")
                            or f"{it['name']} — {it.get('category', 'eatery')} in {district}.",
            "cuisines": it.get("cuisines") or ([it["category"]] if it.get("category") else []),
            "location": it.get("address") or gpp.get("address") or district,
            "district": district, "lat": c[0], "lng": c[1],
            "price_range": max(1, min(3, int(pr))),
            "timings": it.get("hours") or it.get("timings"),
            "phone": it.get("phone"),
            "images": [], "photo_refs": photo_refs(slug),
            "rating": float(it.get("rating") or it.get("google_rating") or gpp.get("rating") or 0),
            "review_count": int(it.get("reviews") or gpp.get("rating_count") or 0),
            "signature_dishes": [{"name": s} for s in (it.get("signature") or [])],
            "accepts_reservations": False,
            "featured": it.get("priority") in ("high", "highest"),
            "verification": it.get("verification") or "single-source",
        })

    for r in et_rows:
        lines.append(
            "insert into public.eateries (slug,name,description,cuisines,location,district,lat,lng,"
            "price_range,timings,phone,images,photo_refs,rating,review_count,signature_dishes,"
            "accepts_reservations,featured,sort_weight,verification) values ("
            f"{q(r['slug'])},{q(r['name'])},{q(r['description'])},{qarr(r['cuisines'])},"
            f"{q(r['location'])},{q(r['district'])},{r['lat']},{r['lng']},{r['price_range']},"
            f"{q(r['timings'])},{q(r['phone'])},{qj(r['images'])},{qj(r['photo_refs'])},"
            f"{r['rating']},{r['review_count']},{qj(r['signature_dishes'])},"
            f"{q(r['accepts_reservations'])},{q(r['featured'])},{WEIGHT},{q(r['verification'])}"
            ") on conflict (slug) do nothing;"
        )

    header = f"""-- ============================================================================
-- 0008 — 2026 research seed
--
-- {len(hs_rows)} hotspots, {len(hm_rows)} homestays, {len(et_rows)} eateries from the
-- verified research pass in data/research/. Generated by
-- data/research/scripts/build_seed_sql.py — edit that, not this file.
--
-- Safety properties:
--   * every statement is INSERT ... ON CONFLICT (slug) DO NOTHING, so re-running
--     is a no-op and an existing slug is never overwritten
--   * sort_weight = {WEIGHT} puts these ahead of the original seed (weight 0)
--   * coordinates are real, from the Google Places API — not estimated
--   * photos live in photo_refs and are resolved at request time by
--     /api/place-photo; the image bytes are deliberately not stored
--
-- NOT YET PHONE-VERIFIED. `verification` records how well attested each row is;
-- nothing here is 'phone-verified' and only a human who actually called may set
-- that. See data/research/README.md before promoting any of it.
-- ============================================================================

begin;

"""
    OUT.write_text(header + "\n".join(lines) + "\n\ncommit;\n")

    print(f"hotspots  {len(hs_rows)}")
    print(f"homestays {len(hm_rows)}")
    print(f"eateries  {len(et_rows)}")
    print(f"total     {len(lines)} statements -> {OUT.name}")
    if skipped:
        print(f"\nskipped {len(skipped)} (not defaulted into the DB):")
        from collections import Counter
        for reason, n in Counter(s[2] for s in skipped).most_common():
            print(f"  {n:3d}  {reason}")
        (RESEARCH / "seed-skipped.json").write_text(
            json.dumps([{"kind": k, "name": n, "reason": r} for k, n, r in skipped],
                       indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
