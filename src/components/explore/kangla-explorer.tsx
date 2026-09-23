"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, ChevronUp, Compass, Landmark, Minus, Plus, Tags, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { kanglaPlaces, type KanglaPlace } from "@/lib/immersive/kangla-places";
import { narrationFor, narrationLanguages } from "@/lib/immersive/narration";
import { useNarration } from "@/components/immersive/use-narration";
import styles from "./kangla-explorer.module.css";

const Map = dynamic(() => import("./kangla-google-3d"), { ssr: false, loading: () => <div className={styles.loading}>Opening Kangla in 3D…</div> });

const KIND_LABEL: Record<KanglaPlace["kind"], string> = {
  guardian: "Guardian figures",
  temple: "Temple",
  gate: "Gateway",
  hall: "Coronation hall",
  museum: "Museum",
  water: "Water",
};

const EASE = [0.22, 1, 0.36, 1] as const;
const pad = (n: number) => String(n).padStart(2, "0");

export function KanglaExplorer({ googleKey = "" }: { googleKey?: string }) {
  const [tilted, setTilted] = useState(true);
  const [labels, setLabels] = useState(false);
  const [overview, setOverview] = useState(0);
  const [zoomStep, setZoomStep] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [touched, setTouched] = useState(false);
  const reduce = useReducedMotion();

  // Choosing a landmark — from a pin or the list — always brings the panel
  // back; clearing one leaves the panel as it was.
  const choose = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) setCollapsed(false);
  }, []);
  const onInteract = useCallback(() => setTouched(true), []);

  const index = kanglaPlaces.findIndex(place => place.id === selectedId);
  const selected = index >= 0 ? kanglaPlaces[index] : null;

  // Three of the eight landmarks have recorded narration; the rest simply show
  // no control. No browser fallback here — the summary on screen is site copy,
  // not a script, so a robot voice reading it would not match the recordings.
  const narration = useNarration(narrationFor(selectedId));
  const { stop: stopNarration } = narration;
  // Moving to another landmark must not leave the previous one talking.
  useEffect(() => stopNarration(), [selectedId, stopNarration]);
  const step = (delta: number) => choose(kanglaPlaces[(index + delta + kanglaPlaces.length) % kanglaPlaces.length].id);

  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } }
    : { initial: { opacity: 0, x: -18 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 18 }, transition: { duration: 0.42, ease: EASE } };
  const drop = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } }
    : { initial: { opacity: 0, y: 40, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 40, scale: 0.98 }, transition: { duration: 0.5, ease: EASE } };
  const collapseButton = (
    <button className={styles.collapse} aria-label="Hide the landmark panel" title="Hide panel" onClick={() => setCollapsed(true)}><ChevronDown size={17} /></button>
  );

  return <div className={styles.page}>
    <header className={styles.pageHead}>
      <div>
        <Link href="/hotspots/kangla-fort" className={styles.back}><ArrowLeft size={14} /> Kangla visitor guide</Link>
        <p className={styles.eyebrow}>Imphal · Manipur <span lang="mni-Mtei">ꯀꯪꯂꯥ</span></p>
        <h1>Kangla <em>in 3D.</em></h1>
      </div>
      <p className={styles.lede}>The moated seat of Manipur’s kings, seen from the air. Eight places to land on — tap a pin or pick one from the list, and the camera takes you there.</p>
    </header>

    <section className={styles.stage} aria-label="Interactive Kangla 3D map" role="region" data-lenis-prevent>
      <Map apiKey={googleKey} tilted={tilted} labels={labels} selectedId={selectedId} overview={overview} zoomStep={zoomStep} onSelect={choose} onInteract={onInteract} />

      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? (
          <motion.button key="tab" className={styles.tab} aria-label="Show the landmark panel" aria-expanded={false} onClick={() => setCollapsed(false)} {...drop}>
            <Landmark size={16} />
            <span>{selected ? selected.name : "Landmarks"}</span>
            <small>{selected ? `${pad(index + 1)} / ${pad(kanglaPlaces.length)}` : pad(kanglaPlaces.length)}</small>
            <ChevronUp size={14} />
          </motion.button>
        ) : (
          <motion.aside key="panel" className={styles.panel} aria-label="Kangla landmarks" {...drop}>
            <AnimatePresence mode="wait" initial={false}>
              {selected ? (
                <motion.div key={selected.id} className={styles.detail} {...slide}>
                  <div className={styles.figure} data-kind={selected.kind}>
                    {selected.image
                      ? <Image src={selected.image} alt={selected.name} fill sizes="(max-width: 760px) 100vw, 380px" priority className={styles.photo} />
                      : <div className={styles.plate} aria-hidden><span>{selected.meiteiName ?? "ꯀꯪꯂꯥ"}</span></div>}
                    <div className={styles.figureActions}>
                      {collapseButton}
                      <button className={styles.close} aria-label="Back to all landmarks" onClick={() => setSelectedId(null)}><X size={15} /></button>
                    </div>
                    <span className={styles.counter}>{pad(index + 1)} / {pad(kanglaPlaces.length)}</span>
                  </div>
                  <div className={styles.body}>
                    <span className={styles.kind}>{KIND_LABEL[selected.kind]}</span>
                    <h2>{selected.name}</h2>
                    {selected.meiteiName && <p className={styles.meitei} lang="mni-Mtei">{selected.meiteiName}</p>}
                    <p className={styles.summary}>{selected.summary}</p>

                    {narration.text && narration.language !== "en" && (
                      <p className={`${styles.translated} ${narration.active.className ?? ""}`} lang={narration.active.lang}>
                        {narration.text}
                      </p>
                    )}


                    <p className={styles.source}>Located from {selected.source}</p>
                  </div>
                  {narrationFor(selected.id) && (
                    <div className={styles.narration}>
                      <div className={styles.langTabs} role="group" aria-label="Narration language">
                        {narrationLanguages.map(item => (
                          <button
                            key={item.code}
                            type="button"
                            aria-pressed={narration.language === item.code}
                            lang={item.lang}
                            className={item.className}
                            onClick={() => narration.setLanguage(item.code)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <button type="button" className={styles.listen} disabled={!narration.canPlay} onClick={narration.toggle}>
                        {narration.speaking ? <VolumeX size={15} aria-hidden /> : <Volume2 size={15} aria-hidden />}
                        {narration.speaking ? "Stop narration" : "Listen to this place"}
                      </button>
                    </div>
                  )}
                  <nav className={styles.stepper} aria-label="Move between landmarks">
                    <button onClick={() => step(-1)}><ArrowLeft size={15} /> Previous</button>
                    <button onClick={() => step(1)}>Next <ArrowRight size={15} /></button>
                  </nav>
                </motion.div>
              ) : (
                <motion.div key="list" className={styles.overview} {...slide}>
                  <header className={styles.head}>
                    <div>
                      <span className={styles.kind}>Landmarks</span>
                      <h2>Eight places to land on</h2>
                    </div>
                    {collapseButton}
                  </header>
                  <ol className={styles.list}>
                    {kanglaPlaces.map((place, i) => (
                      <motion.li key={place.id} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE, delay: 0.1 + i * 0.05 }}>
                        <button onClick={() => choose(place.id)} data-kind={place.kind}>
                          <span className={styles.num}>{pad(i + 1)}</span>
                          <span className={styles.name}>{place.name}<small>{KIND_LABEL[place.kind]}</small></span>
                          <ChevronRight size={15} className={styles.chev} />
                        </button>
                      </motion.li>
                    ))}
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className={styles.controls} aria-label="Map controls" role="toolbar">
        <div className={styles.cluster}>
          <button aria-label="Zoom in" onClick={() => setZoomStep(value => value + 1)}><Plus size={16} /></button>
          <button aria-label="Zoom out" onClick={() => setZoomStep(value => value - 1)}><Minus size={16} /></button>
        </div>
        <button className={styles.single} aria-label="Recenter on the fort" title="Recenter" onClick={() => { choose(null); setOverview(value => value + 1); }}><Compass size={17} /></button>
        <div className={styles.segment}>
          <button aria-pressed={!tilted} onClick={() => setTilted(false)}>2D</button>
          <button aria-pressed={tilted} onClick={() => setTilted(true)}>3D</button>
        </div>
        <button className={styles.single} aria-pressed={labels} aria-label="Toggle Google labels" title="Labels" onClick={() => setLabels(value => !value)}><Tags size={16} /></button>
      </div>

      <AnimatePresence>
        {!touched && (
          <motion.p className={styles.hint} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.5, ease: EASE, delay: 1.2 }}>
            <span>Pinch or scroll</span> to zoom · <span>drag</span> to pan · <span>two fingers</span> to tilt and turn
          </motion.p>
        )}
      </AnimatePresence>
    </section>

    <footer className={styles.caption}>
      <p>Scroll over the map to zoom it; scroll anywhere else to move down the page.</p>
      <p>Google satellite imagery on terrain · the camera is held to roughly 1.4 × 1.6 km around the fort · landmarks are located from OpenStreetMap, checked against aerial imagery.</p>
    </footer>
  </div>;
}
