import { BadgeCheck, CirclePause, CircleX, Hourglass, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CommunityPlaceStatus } from "@/lib/community/rules";
import { STATUS_LABELS } from "@/lib/community/taxonomy";
import { cn } from "@/lib/utils";

/** An icon per status, so the status never rides on colour alone. */
const STATUS_ICON: Record<CommunityPlaceStatus, LucideIcon> = {
  pending: Hourglass,
  published: BadgeCheck,
  held: CirclePause,
  rejected: CircleX,
};

const STATUS_VARIANT = {
  pending: "accent",
  published: "primary",
  held: "default",
  rejected: "outline",
} as const satisfies Record<CommunityPlaceStatus, "accent" | "primary" | "default" | "outline">;

/** Where a community place stands: collecting votes, published, held or not published. */
export function StatusBadge({
  status,
  className,
}: {
  status: CommunityPlaceStatus;
  className?: string;
}) {
  const Icon = STATUS_ICON[status];
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("whitespace-nowrap", className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
