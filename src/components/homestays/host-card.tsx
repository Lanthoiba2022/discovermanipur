import { ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Homestay } from "@/types";

export function HostCard({ homestay }: { homestay: Homestay }) {
  const name = homestay.hostName || "Your host";
  const initials =
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "Y";

  return (
    <section
      aria-labelledby="host-heading"
      className="rounded-[var(--radius-lg)] border border-border bg-surface-sunken p-6"
    >
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          {homestay.hostAvatar && (
            <AvatarImage src={homestay.hostAvatar} alt={`Portrait of ${name}`} />
          )}
          <AvatarFallback className="bg-primary/12 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h2 id="host-heading" className="font-display text-xl">
            Hosted by {name}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
            Verified Discover Manipur host in {homestay.district}
          </p>
        </div>
      </div>

      {homestay.hostStory && (
        <p className="mt-5 leading-relaxed text-muted-foreground">{homestay.hostStory}</p>
      )}
    </section>
  );
}
