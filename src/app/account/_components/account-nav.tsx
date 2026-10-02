"use client";

import { usePathname } from "next/navigation";
import { Bookmark, CalendarDays, LayoutDashboard, Map, MapPinned, User } from "lucide-react";

import { IntentLink } from "@/components/shared/intent-link";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/account/itineraries", label: "Itineraries", icon: Map },
  { href: "/account/places", label: "My places", icon: MapPinned },
  { href: "/account/saved", label: "Saved", icon: Bookmark },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account sections" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="inline-flex min-w-full items-center gap-1 rounded-full border border-border bg-surface-sunken p-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <IntentLink
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {tab.label}
              </IntentLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
