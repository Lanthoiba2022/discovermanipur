"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

interface Layer {
  key: string;
  index: string;
  eyebrow: string;
  mayek: string;
  title: string;
  body: string;
  image: string;
  alt: string;
  href: string;
}

const LAYERS: Layer[] = [
  {
    key: "water",
    index: "01",
    eyebrow: "Water",
    mayek: "ꯏꯁꯤꯡ",
    title: "Loktak, the lake with a floor that moves",
    body: "Rafts of matted vegetation — phumdi — drift across 287 km² of fresh water, cut into rings by fishermen. People live on them. Whole huts, whole mornings, afloat.",
    image: "/file-uploads/loktakComplete.png",
    alt: "Loktak Lake from the air, its circular phumdi fish pens forming a green honeycomb on still water.",
    href: "/hotspots",
  },
  {
    key: "hills",
    index: "02",
    eyebrow: "Hills",
    mayek: "ꯆꯤꯡ",
    title: "Shirui, the hill that flowers once a year",
    body: "The Shirui lily grows on one ridge in Ukhrul and nowhere else on earth. For a few weeks around June the grass goes pink, and the whole district walks up to look.",
    image: "/file-uploads/Hills.jpg",
    alt: "Layers of green Manipur hills fading into morning mist under a pale sky.",
    href: "/hotspots",
  },
  {
    key: "heritage",
    index: "03",
    eyebrow: "Heritage",
    mayek: "ꯀꯪꯂꯥ",
    title: "Kangla, where the kings kept the river",
    body: "The old seat of Manipur's rulers sits on the Imphal river bank — white kanglasha guarding the gate, coronation ground, moats and shrines still tended.",
    image: "/file-uploads/11.jpg",
    alt: "Two white kanglasha dragon-lion statues guarding a shrine at Kangla Fort in Imphal.",
    href: "/hotspots",
  },
  {
    key: "weave",
    index: "04",
    eyebrow: "Weave",
    mayek: "ꯐꯤ",
    title: "The loom in every courtyard",
    body: "Manipur weaves at home. Phanek, innaphi, moirangphee — patterns that say where a woman is from, made on a loin loom under the house eaves.",
    image: "/file-uploads/hand.jpg",
    alt: "A weaver's hands working pale yellow and pink thread across a wooden handloom.",
    href: "/experiences",
  },
];

function LayerPanel({
  layer,
  i,
  count,
  progress,
}: {
  layer: Layer;
  i: number;
  count: number;
  progress: MotionValue<number>;
}) {
  const span = 1 / count;
  const start = i * span;
  const end = start + span;
  const fade = span * 0.32;

  // Scroll-linked ranges must stay inside [0, 1] and strictly increase,
  // otherwise the browser rejects the generated keyframe offsets.
  const opacity = useTransform(
    progress,
    [
      clamp01(start - fade),
      clamp01(start + fade * 0.35),
      clamp01(end - fade * 0.35),
      clamp01(end + fade),
    ],
    i === 0 ? [1, 1, 1, 0] : i === count - 1 ? [0, 1, 1, 1] : [0, 1, 1, 0],
  );
  const scale = useTransform(progress, [clamp01(start - span), clamp01(end + span)], [1.12, 1]);

  // The copy swaps faster than the photo so two captions never overlap mid-crossfade.
  const copyOpacity = useTransform(
    progress,
    [
      clamp01(start - fade * 0.15),
      clamp01(start + fade * 0.55),
      clamp01(end - fade * 0.95),
      clamp01(end - fade * 0.35),
    ],
    i === 0 ? [1, 1, 1, 0] : i === count - 1 ? [0, 1, 1, 1] : [0, 1, 1, 0],
  );
  const copyY = useTransform(
    progress,
    [clamp01(start - fade * 0.15), clamp01(start + fade * 0.55)],
    i === 0 ? [0, 0] : [26, 0],
  );

  return (
    <motion.div style={{ opacity }} className="absolute inset-0">
      <motion.div style={{ scale }} className="absolute inset-0">
        <Image
          src={layer.image}
          alt={layer.alt}
          fill
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-loktak-900 via-loktak-900/55 to-loktak-900/20"
      />
      <div className="shell relative flex size-full flex-col justify-end pb-20 pt-32 md:pb-28">
        <motion.div style={{ opacity: copyOpacity, y: copyY }} className="max-w-2xl">
          <p className="eyebrow mb-4 flex items-center gap-3 text-kangla-400">
            <span className="font-mayek text-base normal-case tracking-normal">{layer.mayek}</span>
            {layer.index} · {layer.eyebrow}
          </p>
          <h3 className="font-display text-3xl leading-[1.05] text-cream-50 sm:text-4xl md:text-5xl">
            {layer.title}
          </h3>
          <p className="mt-5 text-base leading-relaxed text-cream-50/78 md:text-lg">{layer.body}</p>
          <Link
            href={layer.href}
            className="mt-7 inline-flex items-center gap-2 border-b border-cream-50/40 pb-1 text-sm text-cream-50 transition-colors hover:border-cream-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            See this layer
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

function StaticLayers() {
  return (
    <div className="flex flex-col gap-4">
      {LAYERS.map((layer) => (
        <article key={layer.key} className="relative min-h-[26rem] overflow-hidden rounded-[var(--radius-lg)]">
          <Image src={layer.image} alt={layer.alt} fill sizes="100vw" className="object-cover" />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-loktak-900 via-loktak-900/55 to-loktak-900/20"
          />
          <div className="relative flex min-h-[26rem] flex-col justify-end p-7 md:p-10">
            <p className="eyebrow mb-3 text-kangla-400">
              {layer.index} · {layer.eyebrow}
            </p>
            <h3 className="max-w-2xl font-display text-3xl leading-tight text-cream-50">
              {layer.title}
            </h3>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-cream-50/78">{layer.body}</p>
            <Link
              href={layer.href}
              className="mt-6 inline-flex w-fit items-center gap-2 border-b border-cream-50/40 pb-1 text-sm text-cream-50 hover:border-cream-50"
            >
              See this layer
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

export function LayersNarrative() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // The reduced-motion version is a deliberately different layout (a static
  // stack instead of a 400vh sticky scroll), so it cannot share markup with
  // the animated one. `useReducedMotion()` is null during SSR, so branching on
  // it directly would break hydration. Gating on mount keeps the server and
  // the first client render identical, then swaps on the client.
  const mounted = useMounted();

  if (mounted && reduce) {
    return (
      <section id="layers" aria-label="Manipur in layers" className="bg-loktak-900 py-16">
        <div className="shell">
          <h2 className="text-headline mb-10 text-cream-50">Manipur, in four layers</h2>
          <StaticLayers />
        </div>
      </section>
    );
  }

  return (
    <section id="layers" aria-label="Manipur in layers" className="relative bg-loktak-900">
      <div ref={ref} className="relative h-[400vh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          {LAYERS.map((layer, i) => (
            <LayerPanel
              key={layer.key}
              layer={layer}
              i={i}
              count={LAYERS.length}
              progress={scrollYProgress}
            />
          ))}

          <div className="shell pointer-events-none absolute inset-x-0 top-0 pt-28 md:pt-32">
            <h2 className="font-display text-xl text-cream-50/85 md:text-2xl">
              Manipur, in four layers
            </h2>
          </div>

          <ol
            aria-hidden
            className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-4 md:right-8 md:flex"
          >
            {LAYERS.map((layer, i) => (
              <ProgressDot
                key={layer.key}
                label={layer.eyebrow}
                i={i}
                count={LAYERS.length}
                progress={scrollYProgress}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function ProgressDot({
  label,
  i,
  count,
  progress,
}: {
  label: string;
  i: number;
  count: number;
  progress: MotionValue<number>;
}) {
  const span = 1 / count;
  const opacity = useTransform(
    progress,
    [
      clamp01(i * span - 0.05),
      clamp01(i * span + 0.04),
      clamp01((i + 1) * span - 0.04),
      clamp01((i + 1) * span + 0.05),
    ],
    [0.35, 1, 1, 0.35],
  );

  return (
    <motion.li style={{ opacity }} className="flex items-center justify-end gap-3">
      <span className="text-xs uppercase tracking-[0.18em] text-cream-50">{label}</span>
      <span className={cn("h-px w-8 bg-cream-50")} />
    </motion.li>
  );
}
