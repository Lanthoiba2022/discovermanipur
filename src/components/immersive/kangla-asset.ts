import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import type { LandmarkId } from "@/lib/immersive/kangla";

export interface KanglaAsset {
  root: THREE.Group;
  dispose: () => void;
}

export function disposeKanglaAsset(root: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  textures.forEach(texture => {
    // GLTFLoader uses ImageBitmap where available; release CPU image storage too.
    const source = texture.source.data;
    if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) source.close();
    texture.dispose();
  });
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
}

/**
 * Where the two Kangla Sha stand in the guardians courtyard.
 *
 * These are the transforms the original hand-modelled statue nodes occupied.
 * That statue read as a lumpy quadruped rather than the sculpture, so it was
 * cut out of the baked scene and this photo-derived one is instanced into the
 * same two places instead. The
 * courtyard, pavilion and trees around them are untouched.
 */
const KANGLA_SHA_URL = "/models/kangla/kangla-sha.glb";
const KANGLA_SHA_HEIGHT = 7.095;           // world units, matching the old nodes
const KANGLA_SHA_YAW = -Math.PI / 2;
const KANGLA_SHA_PLACEMENTS: Array<[number, number, number]> = [
  [-5.8, 0, 5.065],
  [5.8, 0, 5.065],
];

/** Load the sculpture and drop a copy at each plinth position. */
async function addKanglaSha(root: THREE.Group, signal: AbortSignal) {
  const response = await fetch(KANGLA_SHA_URL, { signal });
  if (!response.ok) throw new Error(`Unable to load the Kangla Sha: ${response.status}`);
  const buffer = await response.arrayBuffer();
  signal.throwIfAborted();

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.parseAsync(buffer, "/models/kangla/");
  if (signal.aborted) { disposeKanglaAsset(gltf.scene); signal.throwIfAborted(); }

  // Measure rather than assume: the export is normalised, so fit it to the
  // height the old nodes had instead of hardcoding a scale factor.
  const box = new THREE.Box3().setFromObject(gltf.scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  const scale = size.y > 0 ? KANGLA_SHA_HEIGHT / size.y : 1;

  for (const position of KANGLA_SHA_PLACEMENTS) {
    // The loaded scene carries its own transform from the glTF node, so the
    // placement goes on a wrapper rather than overwriting it.
    const pivot = new THREE.Group();
    const statue = gltf.scene.clone(true);
    pivot.add(statue);

    pivot.scale.setScalar(scale);
    // The sculpture is modelled facing +X; the courtyard pair look out down
    // the steps, towards +Z.
    pivot.rotation.y = KANGLA_SHA_YAW;
    pivot.position.set(position[0], position[1] - box.min.y * scale, position[2]);

    pivot.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    root.add(pivot);
  }
}

export async function loadKanglaAsset(id: LandmarkId, signal: AbortSignal, progress: (percent: number) => void): Promise<KanglaAsset> {
  const url = `/models/kangla/${id}.glb`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Unable to load ${id}: ${response.status}`);
  const length = Number(response.headers.get("content-length"));
  const reader = response.body?.getReader();
  let buffer: ArrayBuffer;
  if (!reader) buffer = await response.arrayBuffer();
  else {
    const chunks: Uint8Array[] = []; let loaded = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      chunks.push(value); loaded += value.length;
      if (length) progress(Math.min(90, Math.round(loaded / length * 90)));
    }
    const bytes = new Uint8Array(loaded); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    buffer = bytes.buffer;
  }
  signal.throwIfAborted();
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.parseAsync(buffer, "/models/kangla/");
  if (signal.aborted) { disposeKanglaAsset(gltf.scene); signal.throwIfAborted(); }
  gltf.scene.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = !object.name.includes("vegetation"); object.receiveShadow = true;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (material instanceof THREE.MeshStandardMaterial) {
        if (material.map) material.map.anisotropy = 4;
        material.envMapIntensity = .75;
        // Fine plant surfaces cast and receive filtered shadows on both sides.
        if (material.name.startsWith("Leaf ")) material.side = THREE.DoubleSide;
      }
    }
  });
  try {
    if (id === "guardians") await addKanglaSha(gltf.scene, signal);
  } catch (error) {
    disposeKanglaAsset(gltf.scene);
    throw error;
  }

  progress(100);
  return { root: gltf.scene, dispose: () => disposeKanglaAsset(gltf.scene) };
}
