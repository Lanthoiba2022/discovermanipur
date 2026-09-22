"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BedDouble, ChevronLeft, ChevronRight, MapPin, Star, Users } from "lucide-react";

import { AMENITY_META } from "@/components/homestays/amenities";
import { SaveButton } from "@/components/homestays/save-button";
import { cn, formatINR } from "@/lib/utils";
import type { Homestay } from "@/types";

const FALLBACK = "/file-uploads/11.jpg";

export function HomestayCard({ homestay, preload = false }: { homestay: Homestay; preload?: boolean }) {
  const images = homestay.images.length
    ? homestay.images
    : [{ src: FALLBACK, alt: `${homestay.title} in ${homestay.location}` }];
  const [index, setIndex] = useState(0);
  const current = images[Math.min(index, images.length - 1)];

  const step = (delta: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + delta + images.length) % images.length);
  };

  const topAmenities = homestay.amenities.slice(0, 4);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-sm)] transition-shadow duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[var(--shadow-md)]">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt}
          fill
          preload={preload}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 45vw, 92vw"
          className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />

        {homestay.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-foreground">
            Featured
          </span>
        )}

        <SaveButton
          className="absolute right-3 top-3 z-10"
          item={{
            kind: "homestay",
            slug: homestay.slug,
            title: homestay.title,
            subtitle: homestay.location,
            image: images[0].src,
            href: `/homestays/${homestay.slug}`,
          }}
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={step(-1)}
              aria-label={`Previous photo of ${homestay.title}`}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-surface/85 p-1.5 opacity-0 shadow-[var(--shadow-sm)] transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={step(1)}
              aria-label={`Next photo of ${homestay.title}`}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-surface/85 p-1.5 opacity-0 shadow-[var(--shadow-sm)] transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {images.map((img, i) => (
                <span
                  key={img.src}
                  className={cn(
                    "size-1.5 rounded-full transition-all",
                    i === index ? "w-4 bg-cream-50" : "bg-cream-50/55",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-snug">
            <Link href={`/homestays/${homestay.slug}`} className="after:absolute after:inset-0">
              {homestay.title}
            </Link>
          </h3>
          {homestay.reviewCount > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm">
              <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
              <span className="font-medium">{homestay.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({homestay.reviewCount})</span>
            </span>
          )}
        </div>

        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {homestay.location}, {homestay.district}
          </span>
        </p>

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <Users className="size-3.5" aria-hidden="true" />
            {homestay.maxGuests} guests
          </li>
          <li className="flex items-center gap-1.5">
            <BedDouble className="size-3.5" aria-hidden="true" />
            {homestay.bedrooms} {homestay.bedrooms === 1 ? "bedroom" : "bedrooms"}
          </li>
        </ul>

        {topAmenities.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {topAmenities.map((a) => {
              const meta = AMENITY_META[a];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <li
                  key={a}
                  title={meta.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
                >
                  <Icon className="size-3" aria-hidden="true" />
                  <span>{meta.label}</span>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-auto pt-2 text-base">
          <span className="font-display text-xl font-medium">
            {formatINR(homestay.pricePerNight)}
          </span>
          <span className="text-sm text-muted-foreground"> / night</span>
        </p>
      </div>
    </article>
  );
}
