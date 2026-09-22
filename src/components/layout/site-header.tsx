"use client";

import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, Moon, Search, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Logo } from "@/components/layout/logo";
import { SearchInput } from "@/components/search/search-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/lib/use-mounted";
import { navGroups } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const mounted = useMounted();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));


  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // ⌘K / Ctrl+K opens search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        data-site-header
        data-scrolled={scrolled ? "true" : "false"}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled ? "py-2" : "py-4",
        )}
      >
        <div className="shell">
          <div
            className={cn(
              "flex items-center justify-between gap-6 rounded-full px-5 py-2.5 transition-all duration-500",
              scrolled ? "glass shadow-[var(--shadow-md)]" : "bg-transparent",
            )}
          >
            <span className="text-[var(--hdr-fg)]">
              <Logo tone="inherit" />
            </span>

            <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
              {navGroups.map((group) => (
                <div key={group.label} className="group/nav relative">
                  <button
                    className="rounded-full px-4 py-2 text-sm font-medium text-[var(--hdr-fg-muted)] transition-colors hover:text-[var(--hdr-fg)]"
                    aria-haspopup="true"
                  >
                    {group.label}
                  </button>
                  <div className="invisible absolute left-1/2 top-full w-72 -translate-x-1/2 pt-3 opacity-0 transition-all duration-300 group-hover/nav:visible group-hover/nav:opacity-100 group-focus-within/nav:visible group-focus-within/nav:opacity-100">
                    <div className="glass overflow-hidden rounded-[var(--radius-lg)] p-2 shadow-[var(--shadow-lg)]">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={pathname === item.href ? "page" : undefined}
                          className={cn(
                            "block rounded-[var(--radius-sm)] px-4 py-3 transition-colors hover:bg-muted",
                            pathname === item.href && "bg-muted",
                          )}
                        >
                          <span className="block text-sm font-medium">{item.label}</span>
                          {item.description && (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {item.description}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Search Manipur"
                className="text-[var(--hdr-fg)] hover:bg-[var(--hdr-hover)]"
                onClick={() => setSearchOpen(true)}
              >
                <Search />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle colour theme"
                className="text-[var(--hdr-fg)] hover:bg-[var(--hdr-hover)]"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                {mounted && resolvedTheme === "dark" ? <Sun /> : <Moon />}
              </Button>

              <Button variant="primary" size="pill" className="hidden sm:inline-flex" asChild>
                <Link href="/plan">Plan my trip</Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-[var(--hdr-fg)] hover:bg-[var(--hdr-hover)] lg:hidden"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <Menu />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="top-[12vh] max-w-2xl translate-y-0 overflow-visible p-6">
          <DialogHeader>
            <DialogTitle>Search Manipur</DialogTitle>
            <DialogDescription>
              Places, stays, experiences, food and tours.
            </DialogDescription>
          </DialogHeader>
          <SearchInput
            autoFocus
            size="lg"
            label="Search Manipur"
            placeholder="Loktak, Ukhrul, eromba, weaving…"
            onNavigate={() => setSearchOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-loktak-900 text-cream-50"
            initial={{ clipPath: "circle(0% at 92% 6%)" }}
            animate={{ clipPath: "circle(145% at 92% 6%)" }}
            exit={{ clipPath: "circle(0% at 92% 6%)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="shell flex h-full flex-col py-6">
              <div className="flex items-center justify-between">
                <Logo inverted />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close menu"
                  className="text-cream-50 hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  <X />
                </Button>
              </div>

              <nav aria-label="Mobile" className="mt-12 flex-1 overflow-y-auto">
                {navGroups.map((group) => (
                  <div key={group.label} className="mb-10">
                    <p className="eyebrow mb-4 text-kangla-400">{group.label}</p>
                    <ul className="space-y-1">
                      {group.items.map((item, i) => (
                        <motion.li
                          key={item.href}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            aria-current={pathname === item.href ? "page" : undefined}
                            className="block py-2 font-display text-3xl transition-colors hover:text-kangla-400"
                          >
                            {item.label}
                          </Link>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>

              <Button variant="accent" size="lg" className="w-full" asChild>
                <Link href="/plan">Plan my trip</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
