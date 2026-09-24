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
            <a
              href="https://discord.gg/hgGfm6UpU"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-ivory-50 transition-colors duration-200 hover:border-brass-400 hover:text-brass-400"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-current">
                <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Join us on Discord
            </a>
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
