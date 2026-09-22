import Image from "next/image";

const POSTER = "/file-uploads/loktakComplete.png";

/**
 * The hero backdrop.
 *
 * Stills only, deliberately. The one ambient clip in the project is a general
 * Manipur montage shot in the hills, and running it under a frame captioned
 * "Loktak Lake" made the fold claim a place it was not showing. The aerial is
 * also the thing the headline is actually about, and dropping the video takes
 * ~5 MB off the critical path. Reinstate a clip here only when it is footage
 * of this lake.
 */
export function HeroMedia() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Image
        src={POSTER}
        alt="Aerial view of Loktak Lake at dawn, its floating phumdi islands forming a honeycomb of green rings across still water."
        fill
        sizes="100vw"
        preload
        loading="eager"
        fetchPriority="high"
        className="object-cover object-center"
      />
    </div>
  );
}
