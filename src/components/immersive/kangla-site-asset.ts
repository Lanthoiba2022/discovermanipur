import * as THREE from "three";
import { kanglaPlaces } from "@/lib/immersive/kangla-places";
import type { FeatureCollection, Geometry } from "geojson";
import { disposeKanglaAsset, type KanglaAsset } from "./kangla-asset";

// Local metric coordinates: east +X, north -Z. The latitude correction keeps
// mapped footprint dimensions in metres rather than stretched Web Mercator units.
const origin = [93.94202, 24.80894];
const metres = 6378137 * Math.PI / 180;
function point(coordinate: number[]) {
  return new THREE.Vector2((coordinate[0] - origin[0]) * metres * Math.cos(origin[1] * Math.PI / 180), (coordinate[1] - origin[1]) * metres);
}

export async function loadKanglaSite(signal: AbortSignal): Promise<KanglaAsset> {
  const response = await fetch("/models/kangla/kangla-site.geojson", { signal });
  if (!response.ok) throw new Error("Site layout unavailable");
  const data: FeatureCollection<Geometry> = await response.json();
  signal.throwIfAborted();
  const root = new THREE.Group();
  let satellite = false;
  const earth = new THREE.MeshStandardMaterial({ color: "#74846b", roughness: 1 });
  const water = new THREE.MeshStandardMaterial({ color: "#637f84", roughness: .4, metalness: .15 });
  const stone = new THREE.MeshStandardMaterial({ color: "#ddd5c3", roughness: .95 });
  const pathMaterial = new THREE.MeshStandardMaterial({ color: "#b5ad99", roughness: 1 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1800), earth);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.1; ground.receiveShadow = true; root.add(ground);
  // Stream licensed basemap tiles at runtime, using the same provider as the
  // satellite comparison. Never bake Google Maps imagery into model exports.
  const tileCount = 2 ** 16;
  const tileX = (lon: number) => Math.floor((lon + 180) / 360 * tileCount);
  const tileY = (lat: number) => Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * tileCount);
  const x0 = tileX(93.936), x1 = tileX(93.948), y0 = tileY(24.817), y1 = tileY(24.800);
  const mosaic = document.createElement("canvas"); mosaic.width = (x1 - x0 + 1) * 256; mosaic.height = (y1 - y0 + 1) * 256;
  const ctx = mosaic.getContext("2d");
  if (ctx) {
    try {
      await Promise.all(Array.from({ length: (x1 - x0 + 1) * (y1 - y0 + 1) }, async (_, i) => {
        const x = x0 + i % (x1 - x0 + 1), y = y0 + Math.floor(i / (x1 - x0 + 1));
        const tile = await fetch(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/16/${y}/${x}`, { signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]) });
        if (!tile.ok) throw new Error("Satellite imagery unavailable");
        const bitmap = await createImageBitmap(await tile.blob());
        ctx.drawImage(bitmap, (x - x0) * 256, (y - y0) * 256); bitmap.close();
      }));
      const latitude = (y: number) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / tileCount))) * 180 / Math.PI;
      const nw = point([x0 / tileCount * 360 - 180, latitude(y0)]);
      const se = point([(x1 + 1) / tileCount * 360 - 180, latitude(y1 + 1)]);
      const texture = new THREE.CanvasTexture(mosaic); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
      satellite = true; earth.map = texture; earth.color.set("#ffffff"); earth.needsUpdate = true;
      ground.geometry.dispose(); ground.geometry = new THREE.PlaneGeometry(se.x - nw.x, nw.y - se.y);
      ground.position.set((nw.x + se.x) / 2, -.1, -(nw.y + se.y) / 2);
    } catch {
      // Vector footprints and paths remain usable when the remote basemap fails.
      if (signal.aborted) { disposeKanglaAsset(root); signal.throwIfAborted(); }
    }
  }
  for (const feature of data.features) {
    const kind = feature.properties?.kind;
    const geometry = feature.geometry;
    if (satellite && ["moat", "river", "path"].includes(kind)) continue;
    if (geometry.type === "Polygon" && ["building", "moat"].includes(kind)) {
      const rings = geometry.coordinates.map(ring => ring.map(point));
      const shape = new THREE.Shape(rings[0]);
      rings.slice(1).forEach(ring => shape.holes.push(new THREE.Path(ring)));
      // Footprints are mapped; 6 m is an explicitly illustrative massing height.
      const mesh = new THREE.Mesh(kind === "building" ? new THREE.ExtrudeGeometry(shape, { depth: 6, bevelEnabled: false }) : new THREE.ShapeGeometry(shape), kind === "building" ? stone : water);
      mesh.rotation.x = -Math.PI / 2; mesh.position.y = kind === "building" ? .15 : .05;
      mesh.castShadow = kind === "building"; mesh.receiveShadow = true; root.add(mesh);
    }
    if (geometry.type === "LineString" && ["path", "river"].includes(kind)) {
      const width = kind === "river" ? 24 : ["footway", "path", "pedestrian"].includes(feature.properties?.highway) ? 2 : 5;
      for (let i = 1; i < geometry.coordinates.length; i++) {
        const a = point(geometry.coordinates[i - 1]), b = point(geometry.coordinates[i]);
        const length = a.distanceTo(b); if (!length) continue;
        const strip = new THREE.Mesh(new THREE.PlaneGeometry(width, length), kind === "river" ? water : pathMaterial);
        strip.rotation.set(-Math.PI / 2, 0, -Math.atan2(b.x - a.x, b.y - a.y));
        strip.position.set((a.x + b.x) / 2, .08, -(a.y + b.y) / 2); strip.receiveShadow = true; root.add(strip);
      }
    }
  }
  for (const place of kanglaPlaces) {
    const coordinate = point(place.coord);
    const canvas = document.createElement("canvas"); canvas.width = 768; canvas.height = 96;
    const context = canvas.getContext("2d");
    if (!context) continue;
    context.fillStyle = "#142e27"; context.fillRect(0, 0, 768, 96);
    context.fillStyle = "#fff8e8"; context.font = "36px sans-serif"; context.textAlign = "center";
    context.fillText(place.name, 384, 61, 730);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Mesh(new THREE.PlaneGeometry(150, 18.75), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, depthTest: false }));
    label.position.set(coordinate.x, 23, -coordinate.y); label.rotation.x = -Math.PI / 3; label.renderOrder = 2;
    label.onBeforeRender = (_renderer, _scene, camera) => { label.quaternion.copy(root.getWorldQuaternion(new THREE.Quaternion()).invert()).multiply(camera.quaternion); label.updateMatrixWorld(); };
    if (["uttra-shanglen", "the-moats"].includes(place.id)) { label.geometry.dispose(); (label.material as THREE.MeshBasicMaterial).dispose(); texture.dispose(); } else root.add(label);
  }
  return { root, dispose: () => disposeKanglaAsset(root) };
}
