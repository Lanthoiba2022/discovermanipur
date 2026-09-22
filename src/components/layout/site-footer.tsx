import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { footerNav } from "@/lib/nav";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-loktak-900 text-cream-50">
      <div aria-hidden className="weave-rule h-1.5 w-full opacity-60" />

      <div className="shell py-20">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_2.6fr]">
          <div>
            <Logo inverted />
            <p className="mt-6 max-w-sm text-lg leading-relaxed text-cream-200/80">
              <span className="font-mayek">ꯃꯅꯤꯄꯨꯔ</span> — the land of jewels. A traveller&rsquo;s
              way into Manipur, built with the people who live it.
            </p>
            <p className="mt-8 text-sm text-cream-200/60">
              A demonstration site · Not an official government service
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {footerNav.map((group) => (
              <div key={group.label}>
                <p className="eyebrow mb-5 text-kangla-400">{group.label}</p>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm text-cream-200/75 transition-colors hover:text-cream-50"
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

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-cream-200/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Manipur Tourism. Travel gently.</p>
          <p className="font-mayek text-base text-cream-200/70">ꯃꯅꯤꯄꯨꯔ</p>
        </div>
      </div>
    </footer>
  );
}
