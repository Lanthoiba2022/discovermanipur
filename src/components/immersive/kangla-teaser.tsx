import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Map } from "lucide-react";

export function KanglaTeaser({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "my-10" : "shell py-12 md:py-20"} aria-label="Explore the Kangla map">
      <Link href="/explore/kangla" className="group relative grid overflow-hidden rounded-2xl bg-loktak-900 text-cream-50 md:grid-cols-2">
        <div className="relative min-h-64 overflow-hidden"><Image src="/file-uploads/11.jpg" alt="The paired white Kangla Sha guardians in front of the Uttra pavilion at Kangla" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /></div>
        <div className="flex flex-col justify-center p-7 md:p-10"><span className="eyebrow flex items-center gap-2 text-kangla-400"><Map size={16} aria-hidden /> The map collection · 01</span><h2 className="mt-4 font-display text-4xl md:text-5xl">Kangla, from a new angle.</h2><p className="mt-4 max-w-md text-sm leading-7 text-cream-200">Explore the fort and its immediate surroundings on a 3D map. Tilt, rotate and zoom to find your bearings.</p><span className="mt-7 inline-flex items-center gap-3 text-sm text-kangla-400">Open the 3D map <ArrowUpRight size={19} aria-hidden /></span><span className="mt-2 text-xs text-cream-200">MapTiler · 3D buildings & terrain</span></div>
      </Link>
    </section>
  );
}
