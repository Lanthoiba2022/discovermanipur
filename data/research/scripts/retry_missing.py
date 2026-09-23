#!/usr/bin/env python3
"""Re-query the handful that missed, using better query strings.

Some failed on spelling (Silheipung vs Shilheipung, which Maps has with 634
reviews), some because the research name carried a qualifier Maps does not use.
"""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from fetch_places_photos import load_key, search_place, shape

HERE = Path(__file__).parent
RETRY = [
    ("silheipung-garden-lamlai", "Silheipung Garden, Lamlai", "Shilheipung Garden Manipur"),
    ("takmu-water-sports-complex", "Takmu Water Sports Complex", "Takmu Water Sports Complex Loktak Manipur"),
    ("koubru-laikha", "Koubru Laikha", "Koubru Laikha temple Manipur"),
    ("purul", "Purul", "Purul Senapati Manipur"),
    ("kisha-khou", "Kisha Khou", "Kisha Khou Tamenglong Manipur"),
    ("zeiladzang-village", "Zeiladzang Village", "Zeiladzang Tousem Tamenglong Manipur"),
    ("kaihlam-caves", "Kaihlam Caves", "Kaihlam cave Churachandpur Manipur"),
    ("ango-ching", "Ango Ching", "Ango Ching Ukhrul Manipur"),
    ("phuba-thapham-cave", "Haolaipai Supao Keikulu Cave, Phuba Thapham", "Phuba Thapham Senapati Manipur"),
    ("naobas-chakhumang", "Naoba's Chakhumang", "Naoba Chakhumang restaurant Imphal"),
]

key = load_key(HERE / "../../../.env.local")
out = json.loads((HERE / "../photos-google-places.json").read_text())
by_slug = {p["slug"]: p for p in out["places"]}
added = 0
for slug, name, query in RETRY:
    if slug in by_slug and by_slug[slug].get("location"):
        continue
    d = search_place(query, key)
    places = d.get("places") or []
    if not places:
        print(f"  still nothing: {name}")
        continue
    r = shape(places[0], name)
    print(f"  {name} -> {r['matched_name']} ({r['photo_count']} photos, {r['match_confidence']})")
    out["places"].append({"slug": slug, "name": name, "category": "place",
                          "query": query, **r})
    added += 1
out["$meta"]["retried"] = f"{added} subjects re-queried with corrected names"
(HERE / "../photos-google-places.json").write_text(json.dumps(out, indent=2, ensure_ascii=False))
print(f"\nadded {added}")
