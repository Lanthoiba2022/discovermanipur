"""Build the extrusion dataset for the Kangla 3D map from OpenStreetMap.

MapTiler's planet vector tiles only carry buildings that already have a height
tag, which is about ten features over Kangla — not enough to read as a 3D
place. This pulls every building footprint inside the map's bounds straight
from Overpass and records, per building, where its height came from:

  osm:height  a measured/tagged `height` in metres
  osm:levels  `building:levels` x 3.2 m, the usual storey height
  assumed     no height in OSM at all: a flat default, disclosed in the UI

Nothing here is invented geometry. Footprints are OSM ways/relations as mapped;
only the third height class is an assumption, and it is labelled as one so the
map can say so.

Usage: python3 scripts/fetch-kangla-buildings.py
"""
import json, time, urllib.request, urllib.parse
from pathlib import Path

# Must stay in step with KANGLA_MAP_BOUNDS in src/lib/immersive/kangla-places.ts.
SOUTH, WEST, NORTH, EAST = 24.8008, 93.9355, 24.8148, 93.9492
LEVEL_HEIGHT = 3.2   # metres per storey
DEFAULT_HEIGHT = 6.0  # a two-storey building, used only when OSM says nothing
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/models/kangla/kangla-buildings.geojson"
# The map's caption quotes these counts, so they are generated with the data
# rather than typed into the component and left to drift.
SUMMARY = ROOT / "src/lib/immersive/kangla-buildings.generated.ts"

QUERY = f"""[out:json][timeout:90];
(
  way["building"]({SOUTH},{WEST},{NORTH},{EAST});
  relation["building"]["type"="multipolygon"]({SOUTH},{WEST},{NORTH},{EAST});
);
out geom tags;"""


def metres(value):
    """Parse an OSM height tag. Returns None for anything not plainly metric."""
    if not value:
        return None
    text = value.strip().lower().removesuffix("m").strip()
    try:
        height = float(text)
    except ValueError:
        return None
    return height if 1 <= height <= 200 else None


def height_of(tags):
    explicit = metres(tags.get("height"))
    if explicit:
        return round(explicit, 1), "osm:height"
    levels = metres(tags.get("building:levels"))
    if levels:
        return round(levels * LEVEL_HEIGHT, 1), "osm:levels"
    return DEFAULT_HEIGHT, "assumed"


def ring(points):
    coords = [[round(p["lon"], 7), round(p["lat"], 7)] for p in points]
    if coords and coords[0] != coords[-1]:
        coords.append(coords[0])
    return coords if len(coords) >= 4 else None


# Overpass rate-limits and returns 429/504 under load, so try the mirrors in turn.
ENDPOINTS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
)


def query_overpass():
    body = urllib.parse.urlencode({"data": QUERY}).encode()
    last = None
    for attempt in range(3):
        for endpoint in ENDPOINTS:
            request = urllib.request.Request(
                endpoint, data=body,
                headers={"User-Agent": "YeningTourismSprint/1.0 (Kangla 3D map build)"},
            )
            try:
                with urllib.request.urlopen(request, timeout=180) as response:
                    return json.load(response)["elements"]
            except Exception as error:  # noqa: BLE001 - any failure just means try the next mirror
                last = error
                print(f"  {endpoint}: {error}")
        if attempt < 2:
            print("  waiting 30s before retrying...")
            time.sleep(30)
    raise SystemExit(f"Overpass unreachable: {last}")


def main():
    elements = query_overpass()

    features, counts = [], {"osm:height": 0, "osm:levels": 0, "assumed": 0}
    for element in elements:
        tags = element.get("tags", {})
        if element["type"] == "way":
            outer = ring(element.get("geometry") or [])
            rings = [outer] if outer else []
        else:
            rings = [r for r in (ring(m.get("geometry") or [])
                                 for m in element.get("members", []) if m.get("role") == "outer") if r]
        if not rings:
            continue
        height, source = height_of(tags)
        counts[source] += 1
        base = metres(tags.get("min_height")) or 0
        features.append({
            "type": "Feature",
            "id": element["id"],
            "properties": {
                "osm": f"{element['type']}/{element['id']}",
                "name": tags.get("name", ""),
                "building": tags.get("building", "yes"),
                "historic": tags.get("historic", ""),
                "height": height,
                "base": base,
                "heightSource": source,
            },
            "geometry": {"type": "Polygon", "coordinates": rings} if len(rings) == 1
            else {"type": "MultiPolygon", "coordinates": [[r] for r in rings]},
        })

    OUT.write_text(json.dumps({
        "type": "FeatureCollection",
        "bbox": [WEST, SOUTH, EAST, NORTH],
        "source": {
            "name": "OpenStreetMap contributors",
            "license": "ODbL 1.0",
            "url": "https://www.openstreetmap.org/copyright",
            "query": "buildings within the Kangla map bounds, via Overpass",
            "heights": f"{counts['osm:height']} tagged in metres, {counts['osm:levels']} from building:levels x {LEVEL_HEIGHT} m, "
                       f"{counts['assumed']} untagged and drawn at a flat {DEFAULT_HEIGHT} m",
        },
        "features": features,
    }, separators=(",", ":")) + "\n")
    mapped = counts["osm:height"] + counts["osm:levels"]
    SUMMARY.write_text(
        "// Generated by scripts/fetch-kangla-buildings.py — do not edit by hand.\n"
        "export const KANGLA_BUILDING_COUNTS = {\n"
        f"  total: {len(features)},\n"
        f"  /** Buildings whose height comes from an OSM height or building:levels tag. */\n"
        f"  mapped: {mapped},\n"
        f"  /** Buildings with no height in OSM, drawn flat at the default below. */\n"
        f"  assumed: {counts['assumed']},\n"
        f"  defaultHeight: {DEFAULT_HEIGHT},\n"
        "} as const;\n"
    )
    print(f"{len(features)} buildings -> {OUT.relative_to(ROOT)}")
    for source, count in counts.items():
        print(f"  {source}: {count}")
    print(f"counts -> {SUMMARY.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
