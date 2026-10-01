"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Box, Check, ChevronLeft, ChevronRight, ExternalLink, Focus, Glasses, Info, LoaderCircle, Maximize, Minus, Pause, Play, Plus, RotateCcw, Smartphone, Sun, Volume2, VolumeX, X } from "lucide-react";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { kanglaMapUrl, type LandmarkId } from "@/lib/immersive/kangla";
import { narrationFor, narrationLanguages } from "@/lib/immersive/narration";
import { useNarration } from "./use-narration";
import type { ImmersiveStop } from "@/lib/data/content";
import { KanglaSiteSection } from "./kangla-site-section";
import type { ViewerApi } from "./kangla-canvas";
import styles from "./kangla-experience.module.css";

const Canvas = dynamic(() => import("./kangla-canvas"), { ssr: false, loading: () => <div className={styles.loading}><LoaderCircle className="animate-spin" aria-hidden /><span>Building your view of Kangla…</span></div> });
class SceneBoundary extends Component<{ children: ReactNode; onError: (message: string) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError("The 3D scene could not load. Try again, or explore the reference photographs."); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function KanglaExperience({
  initialLandmark,
  stops: kanglaStops,
  sources: kanglaSources,
}: {
  initialLandmark?: string;
  stops: ImmersiveStop[];
  sources: { title: string; href: string; note: string }[];
}) {
  const [index, setIndex] = useState(() => Math.max(0, kanglaStops.findIndex(stop => stop.id === initialLandmark)));
  const [site, setSite] = useState(false);
  const [started, setStarted] = useState(false);
  const [api, setApi] = useState<ViewerApi | null>(null);
  const [assetProgress, setAssetProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [photo, setPhoto] = useState(false);
  const [spin, setSpin] = useState(false);
  const [golden, setGolden] = useState(false);
  const [status, setStatus] = useState("Drag to look around. Scroll or pinch to get closer.");
  const [support, setSupport] = useState({ vr: false, ar: false, checked: false });
  const [xr, setXr] = useState<"immersive-vr" | "immersive-ar" | null>(null);
  const [entering, setEntering] = useState(false);
  const [full, setFull] = useState(false);
  const [visited, setVisited] = useState<number[]>([]);
  const frame = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const stop = kanglaStops[index];
  const { language, setLanguage, active: activeLanguage, text, speaking, canPlay, toggle: narrate, stop: stopNarration } =
    useNarration(narrationFor(stop.id), `${stop.name}. ${stop.description} ${stop.lookFor}`);
  /** Falls back to the English field copy when a stop has no translation yet. */
  const narrationText = text ?? stop.description;
  const onReady = useCallback((value: ViewerApi | null) => setApi(value), []);
  const onError = useCallback((message: string) => setError(message), []);
  const onStatus = useCallback((message: string) => setStatus(message), []);
  const onSession = useCallback((value: "immersive-vr" | "immersive-ar" | null) => { setXr(value); setSpin(false); }, []);
  const onInteract = useCallback(() => setSpin(false), []);
  const onLoading = useCallback((value: number | null) => setAssetProgress(value), []);

  useEffect(() => {
    let active = true;
    async function check() {
      const xrSystem = navigator.xr;
      const results = await Promise.allSettled([
        xrSystem && window.isSecureContext ? xrSystem.isSessionSupported("immersive-vr") : Promise.resolve(false),
        xrSystem && window.isSecureContext ? xrSystem.isSessionSupported("immersive-ar") : Promise.resolve(false),
      ]);
      if (active) {
        setSupport({ vr: results[0].status === "fulfilled" && !!results[0].value, ar: results[1].status === "fulfilled" && !!results[1].value, checked: true });
      }
    }
    void check();
    const fullscreenChanged = () => setFull(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", fullscreenChanged);
    return () => { active = false; document.removeEventListener("fullscreenchange", fullscreenChanged); };
  }, []);
  useEffect(() => { api?.landmark(site ? "site" : stop.id); }, [api, stop.id, site]);
  useEffect(() => { api?.rotate(spin); }, [api, spin]);
  useEffect(() => { api?.light(golden); }, [api, golden]);
  useEffect(() => { api?.pause(photo); }, [api, photo]);
  useEffect(() => {
    const root = overlay.current;
    const preventPlacement = (event: Event) => { if ((event.target as HTMLElement).closest("button,a")) event.preventDefault(); };
    root?.addEventListener("beforexrselect", preventPlacement);
    return () => root?.removeEventListener("beforexrselect", preventPlacement);
  }, []);

  function openModel(id: LandmarkId) {
    const next = kanglaStops.findIndex(s => s.id === id);
    if (next < 0) return;
    select(next);
    setStarted(true);
    frame.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function select(next: number) {
    if (xr || entering) return;
    setSite(false); setIndex(next); setSpin(false); stopNarration();
    setVisited(old => old.includes(next) ? old : [...old, next]);
    setStatus(`Viewing ${kanglaStops[next].name}. Drag to look around, or compare the reference photograph.`);
  }
  function launch() { setStarted(true); setPhoto(false); setVisited(old => old.includes(index) ? old : [...old, index]); }
  async function immersive(mode: "immersive-vr" | "immersive-ar") {
    if (!api || !overlay.current) return;
    setEntering(true); stopNarration(); setPhoto(false);
    await api.enterXR(mode, overlay.current); setEntering(false);
  }
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else if (frame.current?.requestFullscreen) await frame.current.requestFullscreen(); else setStatus("Fullscreen is not available in this browser. You can still drag and zoom in this view."); }
    catch { setStatus("Fullscreen could not open. Continue exploring in the page."); }
  }
  const controlsReady = !!api && assetProgress === null && !photo && !error && !xr && !entering;

  return (
    <div className={styles.page}>
      <div className="shell pt-28 md:pt-32">
        <div className={styles.topline}>
          <Link href="/explore/kangla" className={styles.back}><ArrowLeft size={15} aria-hidden /> Back to map explorer</Link>
          <span className="eyebrow text-muted-foreground">Kangla / Landmark studio / 3D · AR · VR</span>
        </div>
        <header className={styles.heading}>
          <div><p className="eyebrow text-primary mb-3">Imphal, Manipur · A living heritage</p><h1>Kangla, <em>up close.</em></h1></div>
          <p>Explore reconstructed landmarks.<br />Compare real photographs, or bring a model into your space.</p>
        </header>
        <div className={styles.workspace}>
          <div ref={frame} className={styles.viewer} aria-label="Kangla interactive viewer">
            {started && !error && <SceneBoundary key={retry} onError={onError}><Canvas onReady={onReady} onError={onError} onStatus={onStatus} onSession={onSession} onInteract={onInteract} onLoading={onLoading} /></SceneBoundary>}
            {(!started || photo || error) && <div className={styles.photograph}><Image src={stop.image} alt={stop.alt} fill sizes="(min-width: 1024px) 72vw, 100vw" className="object-contain" priority />{started && <div className={styles.photoCredit}>Existing Discover Manipur photo archive · {stop.shortName}</div>}</div>}
            {started && !error && assetProgress !== null && <div className={styles.assetLoading} role="status"><LoaderCircle className="animate-spin" size={22} aria-hidden /><strong>Loading the 3D scene</strong><span>{assetProgress < 90 ? `${assetProgress}% · Downloading detailed geometry & materials` : "Preparing materials and lighting…"}</span></div>}
            <div className={styles.viewerTop}>
              <span className={styles.liveBadge}><span />{photo || !started || error ? "Reference photograph" : "Interactive 3D"}</span>
              <span className={styles.modelBadge}>{site ? "Mapped footprints · Estimated heights" : "Photo-referenced reconstruction"}</span>
            </div>
            {!started && <div className={styles.launch}><span className="eyebrow">An invitation to explore</span><h2>Step into the story.</h2><button className={styles.primary} onClick={launch}><Box size={18} aria-hidden /> Enter 3D experience <ArrowRight size={18} aria-hidden /></button><p>No headset needed · Loads on your device</p></div>}
            {error && <div className={styles.error} role="alert"><Info size={22} aria-hidden /><p>{error}</p><button className={styles.primary} onClick={() => { setError(""); setRetry(n => n + 1); setStarted(true); }}>Reload 3D scene</button></div>}
            {started && !error && !xr && <>
              <div className={styles.viewSwitch} aria-label="View mode">
                <button aria-pressed={site} disabled={!!xr || entering} onClick={() => { setSite(true); setPhoto(false); setSpin(false); }}>Whole site</button>
                <button aria-pressed={!photo && !site} onClick={() => { setSite(false); setPhoto(false); }}><Box size={15} aria-hidden /> 3D model</button>
                <button aria-pressed={photo} onClick={() => { setSite(false); setPhoto(true); }}><Focus size={15} aria-hidden /> Reference photo</button>
              </div>
              {!photo && <div className={styles.sideTools}>
                <button title="Zoom in" aria-label="Zoom in" disabled={!controlsReady} onClick={() => api?.zoom(1)}><Plus size={18} /></button>
                <button title="Zoom out" aria-label="Zoom out" disabled={!controlsReady} onClick={() => api?.zoom(-1)}><Minus size={18} /></button>
                <span />
                <button title="Reset view" aria-label="Reset view" disabled={!controlsReady} onClick={() => { api?.reset(); setSpin(false); }}><RotateCcw size={17} /></button>
                <button title="Fullscreen" aria-label={full ? "Exit fullscreen" : "Enter fullscreen"} onClick={fullscreen}><Maximize size={17} /></button>
              </div>}
              <div className={styles.viewerBottom}>
                <div><span className={styles.stopNumber}>0{index + 1} / 03</span><h2>{site ? "Kangla · Site layout" : stop.shortName}</h2></div>
                <div className={styles.bottomTools}>
                  <button aria-label={spin ? "Pause orbit" : "Auto orbit"} disabled={!controlsReady} aria-pressed={spin} onClick={() => setSpin(!spin)}>{spin ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}<span>{spin ? "Pause orbit" : "Auto orbit"}</span></button>
                  <button aria-label={golden ? "Golden light" : "Daylight"} disabled={!controlsReady} aria-pressed={golden} onClick={() => setGolden(!golden)}><Sun size={17} aria-hidden /><span>{golden ? "Golden light" : "Daylight"}</span></button>
                </div>
              </div>
            </>}
            <div ref={overlay} className={xr ? styles.xrOverlay : styles.xrHidden}>
              {xr && <div className={styles.xrBar}><p role="status">{status}</p><button className={styles.primary} onClick={() => void api?.exitXR()}><X size={17} aria-hidden /> Exit {xr === "immersive-ar" ? "AR" : "VR"}</button></div>}
            </div>
          </div>
          <aside className={styles.story}>
            <div className={styles.storyTop}><span className="eyebrow">Your field notes</span><span>0{index + 1} — 03</span></div>
            <p className={styles.subtitle}>{site ? "Geographic context" : stop.subtitle}</p>
            <h2>{site ? "The whole enclosure" : stop.name}</h2>
            <p className={`${styles.description} ${site ? "" : activeLanguage.className ?? ""}`} lang={site ? undefined : activeLanguage.lang}>{site ? "Explore Kangla’s mapped layout in metres: building footprints, water bodies, paths and the river. North runs toward the top of the initial view. Choose a landmark below to open its detailed Blender reconstruction." : narrationText}</p>
            <div className={styles.look}><Focus size={18} aria-hidden /><div><h3>Take a closer look</h3><p>{site ? "The overview is a location model. Building heights use an illustrative 6 m elevation; river and path widths are estimates. Use the satellite map below to compare the real landscape." : stop.lookFor}</p></div></div>
            {!site && (
              <div className={styles.languageTabs} role="group" aria-label="Narration language">
                {narrationLanguages.map(item => (
                  <button
                    key={item.code}
                    type="button"
                    aria-pressed={language === item.code}
                    lang={item.lang}
                    className={item.className}
                    onClick={() => { stopNarration(); setLanguage(item.code); }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
            <button className={styles.listen} disabled={!canPlay || site} onClick={narrate}>{speaking ? <VolumeX size={17} aria-hidden /> : <Volume2 size={17} aria-hidden />}{speaking ? "Stop narration" : "Listen to this story"}</button>
            <div className={styles.storyNav}><button disabled={index === 0 || !!xr || entering} onClick={() => select(index - 1)} aria-label="Previous landmark"><ChevronLeft size={20} /></button><span>{visited.length} of 3 discovered</span><button disabled={index === 2 || !!xr || entering} onClick={() => select(index + 1)} aria-label="Next landmark"><ChevronRight size={20} /></button></div>
          </aside>
        </div>
        <div className={styles.underViewer}>
          <p role="status" aria-live="polite">{status}</p>
          <span><Info size={13} aria-hidden /> Detailed materials · Exterior views</span>
        </div>
        <nav className={styles.stops} aria-label="Choose a Kangla landmark">
          {kanglaStops.map((item, i) => <button key={item.id} aria-current={i === index ? "step" : undefined} disabled={!!xr || entering} onClick={() => select(i)}>
            <div className={styles.thumb}><Image src={item.image} alt="" fill sizes="90px" className="object-cover" /></div>
            <div><span className={styles.stopLabel}>LANDMARK 0{i + 1}</span><strong>{item.shortName}</strong></div>
            <span className={styles.stopIcon}>{visited.includes(i) ? <Check size={16} aria-label="Visited" /> : <ArrowRight size={16} aria-hidden />}</span>
          </button>)}
        </nav>
        <KanglaSiteSection onOpenModel={openModel} />
        <section className={styles.immersiveBand} aria-label="AR and VR options">
          <div><span className="eyebrow text-accent">A different perspective</span><h2>Bring Kangla a little closer.</h2><p>Explore at your desk, step into VR, or place a miniature in your room.</p></div>
          <div className={styles.xrOptions}>
            <button disabled={!support.vr || !api || assetProgress !== null || !!error || entering || !!xr} onClick={() => void immersive("immersive-vr")}><Glasses size={23} aria-hidden /><span><strong>{entering ? "Opening…" : "Enter VR"}</strong><small>{!support.checked ? "Checking device…" : support.vr ? started ? "Headset ready" : "Enter 3D to begin" : "Compatible headset required"}</small></span><ArrowRight size={17} aria-hidden /></button>
            <button disabled={!support.ar || !api || assetProgress !== null || !!error || entering || !!xr} onClick={() => void immersive("immersive-ar")}><Smartphone size={23} aria-hidden /><span><strong>Place in your space</strong><small>{!support.checked ? "Checking device…" : support.ar ? started ? "Scan a table or floor" : "Enter 3D to begin" : "WebXR AR device required"}</small></span><ArrowRight size={17} aria-hidden /></button>
          </div>
        </section>
        <div className={styles.bottomGrid}>
          <section className={styles.context}>
            <span className="eyebrow text-muted-foreground">The real place</span><h2>Find your bearings.</h2><p>Choose Whole site in the 3D viewer to explore the mapped buildings, paths and water in desktop, AR or VR. The detailed scenes are separate architectural studies. The satellite map places the landmarks at their mapped OpenStreetMap coordinates.</p>
            <div className={styles.mapActions}><a href={kanglaMapUrl} target="_blank" rel="noreferrer">Open in Google Maps <ExternalLink size={14} aria-hidden /></a></div>
            <Link href="/hotspots/kangla-fort" className={styles.visitLink}>Plan a real visit to Kangla <ArrowRight size={17} aria-hidden /></Link>
          </section>
          <section className={styles.context}>
            <span className="eyebrow text-muted-foreground">Built with context</span><h2>From photograph to form.</h2><p>{stop.reconstruction} This is not a photogrammetric scan or a measured digital twin.</p>
            <details className={styles.sources}><summary>References & experience notes</summary><p>The courtyards, pavilions, ground and foliage were built and rendered in Blender, with continuous sculpted geometry and scanned surface materials. The Kangla Sha sculpture itself is different: it was reconstructed from a single CC0 photograph of the replica standing outside the Kangla Museum using image-to-3D, then repaired by hand. The tree behind the statue had been absorbed into its head as antlers, so that geometry was cut away and the single swept horn rebuilt from the photograph. It is a reconstruction of the sculpture, not a scan of it, and the far side was never photographed. The reference photographs are ordinary photographs, not 360° captures. Map and conservation references inform context. Scanned materials and environmental lighting are CC0 assets from Poly Haven; they are not site scans.</p><ul>{kanglaSources.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer">{source.title} <ExternalLink size={12} aria-hidden /></a><p>{source.note}</p></li>)}</ul><p>AR/VR needs HTTPS (or localhost), a compatible browser and supported hardware. AR uses surface detection; no camera image is uploaded by this experience. In VR, use your headset’s system menu to exit. All landmark stories and photos remain available without 3D.</p><p>Use the named zoom and reset buttons for keyboard access. Automatic orbit starts only when you choose it. Narration uses your browser’s available English voice.</p></details>
          </section>
        </div>
      </div>
    </div>
  );
}
