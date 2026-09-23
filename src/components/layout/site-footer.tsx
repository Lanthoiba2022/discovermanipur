import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { footerNav } from "@/lib/nav";

/**
 * No top margin on the footer: the weave band is the divider, and a margin
 * here showed as a strip of page background wherever the last section is a
 * dark or crimson band — which the landing page now ends on.
 */
export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-ink-950 text-ivory-50">
      <div aria-hidden className="weave-band w-full opacity-70" />

      <div className="shell py-20">
        <div className="grid gap-14 lg:grid-cols-[1fr_2.8fr]">
          <div>
            <Logo inverted />
            <p className="mt-6 max-w-sm text-lg leading-relaxed text-ivory-50/75">
              <span className="font-mayek">ꯃꯅꯤꯄꯨꯔ</span> — the land of jewels. A traveller&rsquo;s
              way into Manipur, built with the people who live it.
            </p>
            <p className="mt-8 text-sm text-ivory-50/50">
              A demonstration site · Not an official government service
            </p>
          </div>

          {/* The full site map. Everything the mega menu exposes is repeated
              here, so the footer works as the fallback index it is meant to be. */}
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {footerNav.map((group) => (
              <div key={group.label}>
                <p className="eyebrow mb-5 text-brass-400">{group.label}</p>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm text-ivory-50/70 transition-colors duration-200 hover:text-ivory-50"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-ivory-50/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Manipur Tourism. Travel gently.</p>
          <p className="font-mayek text-base text-ivory-50/65">ꯃꯅꯤꯄꯨꯔ</p>
        </div>
      </div>
    </footer>
  );
}
