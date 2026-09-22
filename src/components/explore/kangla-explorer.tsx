"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Compass, MapPinned, Tags } from "lucide-react";
import { useState } from "react";
import { KANGLA_BUILDING_COUNTS as counts } from "@/lib/immersive/kangla-buildings.generated";
import styles from "./kangla-explorer.module.css";

const Map = dynamic(() => import("./kangla-maptiler"), { ssr: false, loading: () => <div className={styles.loading}>Opening Kangla’s 3D map…</div> });

export function KanglaExplorer({ mapTilerKey = "" }: { mapTilerKey?: string }) {
  const [tilted, setTilted] = useState(true);
  const [labels, setLabels] = useState(true);
  const [overview, setOverview] = useState(0);
  return <div className={styles.page}>
    <header className={styles.header}>
      <div><Link href="/hotspots/kangla-fort" className={styles.back}><ArrowLeft size={14} /> Kangla visitor guide</Link><h1>Kangla <em>in 3D.</em></h1></div>
      <p>Imphal, Manipur<span>The fort & its immediate surroundings</span></p>
    </header>
    <section className={styles.map} aria-label="Interactive Kangla 3D map" data-lenis-prevent>
      <Map apiKey={mapTilerKey} tilted={tilted} labels={labels} overview={overview} />
      <div className={styles.mapTop}><span className={styles.badge}><MapPinned size={14} /> Kangla area <span>· MapTiler</span></span><button className={styles.reset} onClick={() => setOverview(value => value + 1)}><Compass size={16} /> Recenter</button></div>
      <div className={styles.controls} aria-label="Map display controls"><div><button aria-pressed={!tilted} onClick={() => setTilted(false)}>2D</button><button aria-pressed={tilted} onClick={() => setTilted(true)}>3D</button></div><button aria-pressed={labels} onClick={() => setLabels(value => !value)}><Tags size={15} /> Labels</button></div>
    </section>
    <footer className={styles.caption}>
      <p>Drag to pan · Right-drag to tilt and rotate · Scroll to zoom</p>
      <div className={styles.legend}>
        <span><i data-height="mapped" /> Height from the storey count in OpenStreetMap</span>
        <span><i data-height="assumed" /> No height mapped — drawn flat at {counts.defaultHeight} m</span>
      </div>
      <span>Footprints are the {counts.total} OpenStreetMap buildings inside these bounds; {counts.mapped} carry a mapped height. Terrain is shown at its natural scale.</span>
    </footer>
  </div>;
}
