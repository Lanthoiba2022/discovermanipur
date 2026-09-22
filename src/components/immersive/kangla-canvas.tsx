"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { kanglaStops, type LandmarkId } from "@/lib/immersive/kangla";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { Sky } from "three/addons/objects/Sky.js";
import { loadKanglaAsset, type KanglaAsset } from "./kangla-asset";

import { loadKanglaSite } from "./kangla-site-asset";

export interface ViewerApi {
  landmark: (id: LandmarkId | "site") => void;
  reset: () => void;
  zoom: (direction: number) => void;
  rotate: (enabled: boolean) => void;
  light: (golden: boolean) => void;
  pause: (paused: boolean) => void;
  enterXR: (mode: "immersive-vr" | "immersive-ar", overlay: HTMLElement) => Promise<void>;
  exitXR: () => Promise<void>;
}
interface Props {
  onReady: (api: ViewerApi | null) => void;
  onError: (message: string) => void;
  onStatus: (message: string) => void;
  onSession: (mode: "immersive-vr" | "immersive-ar" | null) => void;
  onInteract: () => void;
  onLoading: (percent: number | null) => void;
}

export default function KanglaCanvas({ onReady, onError, onStatus, onSession, onInteract, onLoading }: Props) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); }
    catch { onError("3D isn’t available in this browser. You can still explore the reference photographs and landmark stories below."); return; }
    let alive = true, paused = false, pending = false, mode: "immersive-vr" | "immersive-ar" | null = null;
    let session: XRSession | null = null, hitSource: XRHitTestSource | null = null;
    let placed = false, selected = kanglaStops[0];
    let site = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let flight: { start: number; from: THREE.Vector3; to: THREE.Vector3; targetFrom: THREE.Vector3; targetTo: THREE.Vector3 } | null = null;
    let model: KanglaAsset | null = null;
    let assetRequest: AbortController | null = null;
    let loadingAsset = false;
    let needsRender = true;
    const scene = new THREE.Scene();
    const background = new THREE.Color("#c7d6e0"); scene.background = background;
    scene.fog = new THREE.Fog("#c7d6e0", 65, 160);
    const camera = new THREE.PerspectiveCamera(48, 1, .1, 300);
    camera.position.fromArray(selected.camera);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.xr.enabled = true;
    renderer.domElement.setAttribute("aria-label", "Interactive 3D reconstruction of Kangla. Drag to orbit, scroll to zoom, or use the view controls.");
    renderer.domElement.setAttribute("role", "img");
    host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.fromArray(selected.target); controls.enableDamping = true; controls.dampingFactor = .08;
    controls.minDistance = 7; controls.maxDistance = 52; controls.maxPolarAngle = Math.PI / 2 - .025; controls.enablePan = false;
    controls.autoRotateSpeed = .45; controls.update();
    const interaction = () => { flight = null; controls.autoRotate = false; onInteract(); };
    controls.addEventListener("start", interaction);
    const changed = () => { needsRender = true; };
    controls.addEventListener("change", changed);
    const hemisphere = new THREE.HemisphereLight("#dce9ff", "#6c6255", .7); scene.add(hemisphere);
    const sun = new THREE.DirectionalLight("#fff5e4", 2.5); sun.position.set(-18, 26, 28); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -35; sun.shadow.camera.right = 35; sun.shadow.camera.top = 35; sun.shadow.camera.bottom = -35; sun.shadow.normalBias = .015; sun.shadow.bias = -.00008; sun.shadow.radius = 3;
    scene.add(sun); scene.add(sun.target);
    const sky = new Sky(); sky.scale.setScalar(200); sky.material.uniforms.turbidity.value = 3;
    sky.material.uniforms.rayleigh.value = 1.25; sky.material.uniforms.mieCoefficient.value = .006;
    sky.material.uniforms.sunPosition.value.copy(sun.position); scene.add(sky);
    let environment: THREE.WebGLRenderTarget | null = null;
    const pmrem = new THREE.PMREMGenerator(renderer);
    void new HDRLoader().loadAsync("/models/kangla/forest-light.hdr").then(hdr => {
      if (!alive) { hdr.dispose(); return; }
      environment = pmrem.fromEquirectangular(hdr); scene.environment = environment.texture;
      scene.environmentIntensity = .85; needsRender = true; hdr.dispose(); pmrem.dispose();
    }).catch(() => { if (alive) pmrem.dispose(); });
    const reticle = new THREE.Mesh(new THREE.RingGeometry(.09, .12, 36).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#ddbd55", side: THREE.DoubleSide }));
    reticle.matrixAutoUpdate = false; reticle.visible = false; scene.add(reticle);
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const occlusion = new GTAOPass(scene, camera, 512, 512);
    occlusion.blendIntensity = .7;
    occlusion.updateGtaoMaterial({ radius: .8, thickness: .6, samples: 8, distanceFallOff: 1 });
    occlusion.updatePdMaterial({ radius: 4, samples: 8 });
    const output = new OutputPass();
    composer.addPass(renderPass); composer.addPass(occlusion); composer.addPass(output);
    const move = (position: THREE.Vector3, target: THREE.Vector3, immediate = false) => {
      if (reducedMotion || immediate) { camera.position.copy(position); controls.target.copy(target); controls.update(); needsRender = true; return; }
      flight = { start: performance.now(), from: camera.position.clone(), to: position, targetFrom: controls.target.clone(), targetTo: target };
      needsRender = true;
    };
    const reset = (immediate = false) => {
      if (session) return;
      move(site ? new THREE.Vector3(500, 850, 800) : new THREE.Vector3(...selected.camera), site ? new THREE.Vector3(0, 0, 100) : new THREE.Vector3(...selected.target), immediate);
    };
    const configure = () => {
      camera.near = site ? 1 : .1; camera.far = site ? 4000 : 300; camera.updateProjectionMatrix();
      controls.minDistance = site ? 70 : 7; controls.maxDistance = site ? 1800 : 52;
      controls.enablePan = site; controls.maxPolarAngle = Math.PI / 2 - .025;
      sky.scale.setScalar(site ? 3000 : 200);
      scene.fog = site ? null : new THREE.Fog(background, 65, 160);
      sun.castShadow = !site; occlusion.enabled = !site && host.clientWidth >= 700;
    };
    const resize = () => { const { width, height } = host.getBoundingClientRect(); if (width && height && !renderer.xr.isPresenting) { camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height); composer.setSize(width, height); occlusion.enabled = !site && width >= 700; needsRender = true; } };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    const contextLost = (event: Event) => { event.preventDefault(); onError("The graphics connection was interrupted. Reload the 3D scene, or use Reference photo to continue."); };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    const endSession = () => {
      hitSource?.cancel(); hitSource = null; session = null; mode = null; placed = false;
      if (!alive) return;
      reticle.visible = false; sky.visible = true;
      if (model) { model.root.visible = true; model.root.position.set(0, 0, 0); model.root.scale.setScalar(1); }
      scene.background = background; scene.fog = new THREE.Fog(background, 65, 160);
      controls.enabled = true; sun.position.set(-18, 26, 28); sun.target.position.set(0, 0, 0);
      configure(); reset(true); resize(); onSession(null); onStatus("Back in the desktop view.");
    };
    const place = () => {
      if (!model || mode !== "immersive-ar" || !reticle.visible || placed) return;
      model.root.position.setFromMatrixPosition(reticle.matrix); model.root.visible = true; placed = true; reticle.visible = false;
      sun.position.copy(model.root.position).add(new THREE.Vector3(-2, 4, 3)); sun.target.position.copy(model.root.position);
      onStatus("Model placed. Move around it to explore. Use Exit AR to return.");
    };
    let previous = 0;
    renderer.setAnimationLoop((time, frame) => {
      if (!alive || ((!session) && (document.hidden || paused))) return;
      const delta = Math.min((time - previous) / 1000, .05); previous = time;
      if (mode === "immersive-ar" && frame && hitSource && !placed) {
        const space = renderer.xr.getReferenceSpace();
        const hit = frame.getHitTestResults(hitSource)[0]; const pose = space && hit?.getPose(space);
        reticle.visible = !!pose; if (pose) reticle.matrix.fromArray(pose.transform.matrix);
      }
      if (!session) {
        if (flight) {
          const t = Math.min((performance.now() - flight.start) / 650, 1);
          const eased = t * t * (3 - 2 * t);
          camera.position.lerpVectors(flight.from, flight.to, eased);
          controls.target.lerpVectors(flight.targetFrom, flight.targetTo, eased);
          needsRender = true;
          if (t === 1) flight = null;
        }
        controls.update(delta);
      }
      if (session) renderer.render(scene, camera);
      else if (needsRender) { composer.render(delta); needsRender = false; }
    });
    const api: ViewerApi = {
      landmark(id) {
        if (session || pending) return;
        flight = null; site = id === "site";
        selected = kanglaStops.find(s => s.id === id) ?? kanglaStops[0];
        assetRequest?.abort(); const request = new AbortController(); assetRequest = request;
        loadingAsset = true; controls.enabled = false; onLoading(0);
        if (model) model.root.visible = false;
        void (id === "site" ? loadKanglaSite(request.signal) : loadKanglaAsset(id, request.signal, percent => { if (alive && !request.signal.aborted) onLoading(percent); })).then(asset => {
          if (!alive || request.signal.aborted) { asset.dispose(); return; }
          if (model) { scene.remove(model.root); model.dispose(); }
          model = asset; scene.add(model.root); needsRender = true; loadingAsset = false; controls.enabled = true;
          configure(); reset(true); onLoading(null); onStatus(site ? "Whole-site layout · © OpenStreetMap contributors · Imagery: Esri, Maxar, Earthstar Geographics. Heights and path widths are illustrative. Drag to orbit; right-drag to pan." : `Scene ready: ${selected.name}. Drag to explore the details.`);
        }).catch(error => {
          if (!alive || request.signal.aborted) return;
          loadingAsset = false; onLoading(null);
          onError(error instanceof Error ? "The detailed 3D asset could not load. Check your connection and reload the scene." : "The 3D scene could not load.");
        });
      },
      reset: () => reset(),
      zoom(direction) { if (session) return; const offset = camera.position.clone().sub(controls.target); offset.multiplyScalar(direction > 0 ? .82 : 1.22).clampLength(controls.minDistance, controls.maxDistance); move(controls.target.clone().add(offset), controls.target.clone()); },
      rotate(enabled) { controls.autoRotate = enabled; },
      light(golden) { needsRender = true; sun.color.set(golden ? "#ffd49a" : "#fff0d6"); sun.intensity = golden ? 2.0 : 2.5; hemisphere.intensity = golden ? .5 : .7; background.set(golden ? "#e5d7c0" : "#c7d6e0"); sky.material.uniforms.sunPosition.value.set(golden ? -28 : -18, golden ? 10 : 26, 28); if (!session) { scene.background = background; scene.fog = site ? null : new THREE.Fog(background, 65, 160); } },
      pause(value) { paused = value; needsRender = true; },
      async enterXR(requestedMode, overlay) {
        if (pending || session || loadingAsset || !model) return;
        if (!navigator.xr || !window.isSecureContext) { onStatus("AR and VR require a compatible device and a secure HTTPS connection. The 3D view works here without a headset."); return; }
        pending = true;
        let requested: XRSession | null = null;
        try {
          // Request directly in the click handler, preserving user activation.
          requested = await navigator.xr.requestSession(requestedMode, requestedMode === "immersive-ar"
            ? { requiredFeatures: ["local", "hit-test"], optionalFeatures: ["dom-overlay"], domOverlay: { root: overlay } }
            : { requiredFeatures: ["local-floor"], optionalFeatures: ["dom-overlay"], domOverlay: { root: overlay } });
          if (!alive) { await requested.end(); return; }
          flight = null; camera.near = .05; camera.updateProjectionMatrix();
          session = requested; mode = requestedMode; controls.enabled = false; controls.autoRotate = false;
          requested.addEventListener("end", endSession, { once: true }); requested.addEventListener("select", place);
          renderer.xr.setReferenceSpaceType(requestedMode === "immersive-ar" ? "local" : "local-floor");
          if (requestedMode === "immersive-ar") {
            scene.background = null; scene.fog = null; sky.visible = false; model.root.visible = false; model.root.scale.setScalar(site ? .0007 : .012);
            const viewerSpace = await requested.requestReferenceSpace("viewer");
            hitSource = await requested.requestHitTestSource!({ space: viewerSpace }) ?? null;
            if (!hitSource) throw new Error("Surface detection is unavailable");
            onStatus("Move your phone slowly over a table or floor. Tap when the gold ring appears to place Kangla.");
          } else {
            model.root.scale.setScalar(site ? .002 : 1); model.root.position.set(0, site ? .7 : 0, site ? -2.5 : -19); camera.position.set(0, 0, 0); camera.rotation.set(0, 0, 0);
            onStatus(site ? "Kangla site miniature. Walk around the layout; use your headset’s system menu to exit." : "Look around to explore. Use your headset’s system menu to exit VR.");
          }
          if (!alive || session !== requested) { if (session === requested) await requested.end(); return; }
          await renderer.xr.setSession(requested);
          if (alive) onSession(requestedMode);
        } catch (error) {
          if (requested) await requested.end().catch(() => {});
          endSession();
          if (alive) onStatus(error instanceof DOMException && error.name === "NotAllowedError"
            ? "Session permission was declined. You can keep exploring in 3D and try again when ready."
            : "This device could not start the immersive session. Check headset connection or AR support, then try again.");
        } finally { pending = false; }
      },
      async exitXR() { try { await session?.end(); } catch { onStatus("Use your device’s system controls to close the immersive session."); } },
    };
    onReady(api);
    return () => {
      alive = false; assetRequest?.abort(); onReady(null); observer.disconnect(); controls.removeEventListener("start", interaction); controls.removeEventListener("change", changed); controls.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", contextLost); renderer.setAnimationLoop(null);
      hitSource?.cancel(); hitSource = null; if (session) { session.removeEventListener("select", place); void session.end().catch(() => {}); }
      model?.dispose(); environment?.dispose(); pmrem.dispose(); sky.geometry.dispose(); sky.material.dispose(); reticle.geometry.dispose(); reticle.material.dispose(); renderPass.dispose(); occlusion.dispose(); output.dispose(); composer.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [onReady, onError, onStatus, onSession, onInteract, onLoading]);
  return <div ref={container} className="absolute inset-0 touch-none" data-lenis-prevent data-testid="kangla-canvas" />;
}
