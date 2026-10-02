"use client";

import { usePathname } from "next/navigation";

import { IntentLink } from "@/components/shared/intent-link";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/places", label: "Community places" },
  { href: "/admin/contributors", label: "Contributors" },
  { href: "/admin/photos", label: "Photos" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="border-b border-border">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {LINKS.map((link) => {
          // Overview matches exactly; every other section also owns its nested pages.
          const active =
            pathname === link.href || (link.href !== "/admin" && pathname.startsWith(`${link.href}/`));
          return (
            <li key={link.href}>
              <IntentLink
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-block whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors",
                  active
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </IntentLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
