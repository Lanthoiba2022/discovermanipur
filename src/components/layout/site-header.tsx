"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll, useMotionValueEvent } from "framer-motion";
import { ChevronDown, Menu, Moon, Search, Sun, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

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
import { iconFor } from "@/lib/icons";
import { useMounted } from "@/lib/use-mounted";
import { accountNav, navGroups, type NavGroup } from "@/lib/nav";
import { cn } from "@/lib/utils";

const EASE_FLAT = [0.4, 0, 0.1, 1] as const;

/** Each trigger owns its own panel, so the id has to be per-group. */
const panelId = (label: string) => `mega-${label.toLowerCase()}`;

/**
 * One mega-menu panel.
 *
 * Rendered immediately after its own trigger rather than once at the end of
 * the header, so the tab order matches the visual order: Tab from an open
 * trigger lands on the first link inside the panel it just opened, not on the
 * next trigger along. It positions against the capsule, which is already the
 * shell width, so it needs no inner container of its own.
 */
function MegaPanel({
  group,
  open,
  pathname,
  reduce,
  onNavigate,
}: {
  group: NavGroup;
  open: boolean;
  pathname: string;
  reduce: boolean | null;
  onNavigate: () => void;
}) {
  return (
        <AnimatePresence>
      {open && (
        <motion.div
          id={panelId(group.label)}
          key={group.label}
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: EASE_FLAT }}
          className="absolute left-0 right-0 top-full z-10 hidden pt-3 lg:block"
        >
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface-sand shadow-[var(--shadow-lg)] backdrop-blur-xl">
              <div className="grid gap-8 p-7 lg:grid-cols-[1fr_20rem] lg:gap-10">
                <div>
                  <p className="eyebrow rule-flank rule-flank-start mb-6 text-muted-foreground">
                    {group.blurb}
                  </p>

                  <ul className="grid gap-1 sm:grid-cols-2">
                    {group.items.map((item) => {
                      const Icon = iconFor(item.icon);
                      const current = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => onNavigate()}
                            aria-current={current ? "page" : undefined}
                            className={cn(
                              "group/item flex items-start gap-3.5 rounded-[var(--radius)] p-3 transition-colors duration-200",
                              "hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                              current && "bg-surface",
                            )}
                          >
                            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-surface text-primary transition-colors duration-200 group-hover/item:bg-primary group-hover/item:text-primary-foreground">
                              <Icon aria-hidden className="size-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="text-[0.9375rem] font-semibold leading-tight text-foreground">
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className="eyebrow rounded-full bg-accent/20 px-1.5 py-0.5 text-[0.5625rem] text-brass-700">
                                    {item.badge}
                                  </span>
                                )}
                              </span>
                              {item.description && (
                                <span className="mt-1 block text-sm leading-snug text-muted-foreground">
                                  {item.description}
                                </span>
                              )}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {group.feature && (
                  <Link
                    href={group.feature.href}
                    onClick={() => onNavigate()}
                    className="group/feature relative hidden overflow-hidden rounded-[var(--radius)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:block"
                  >
                    <Image
                      src={group.feature.image}
                      alt={group.feature.alt}
                      fill
                      sizes="20rem"
                      className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.4,0,0.1,1)] group-hover/feature:scale-105"
                    />
                    <span aria-hidden className="absolute inset-0 bg-ink-950/25" />
                    <span aria-hidden className="scrim-copy absolute inset-0" />
                    <span className="relative flex h-full flex-col justify-end p-5">
                      <span className="eyebrow mb-2 text-brass-300">
                        {group.feature.eyebrow}
                      </span>
                      <span className="font-display text-xl leading-tight text-ivory-50">
                        {group.feature.title}
                      </span>
                      <span className="mt-2 text-sm leading-snug text-ivory-50/75">
                        {group.feature.body}
                      </span>
                    </span>
                  </Link>
                )}
              </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


/**
 * The site chrome.
 *
 * Two things drove this rebuild. First, the old nav reached 9 of ~45 routes —
 * the 3D explorer, the host funnel, search and sign-in had no entry point at
 * all, so the mega menu exists to surface the whole site at once. Second, the
 * old dropdowns opened on `:hover`/`:focus-within` only: the triggers were
 * buttons with no handler, which meant they could never be opened from a
 * keyboard and behaved unpredictably on touch. This is a real disclosure —
 * click, Enter/Space, Escape, outside-click and following a link all close it.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const mounted = useMounted();
  const reduce = useReducedMotion();

  const headerRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement | null>());
  /** Pointer-intent timer, so the panel does not flicker between triggers. */
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  const closePanel = useCallback((restoreFocusTo?: string) => {
    setOpenGroup(null);
    if (restoreFocusTo) triggerRefs.current.get(restoreFocusTo)?.focus();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Escape closes the panel and returns focus to the trigger that opened it.
  useEffect(() => {
    if (!openGroup) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePanel(openGroup);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openGroup, closePanel]);

  // Click anywhere outside the header dismisses the panel.
  useEffect(() => {
    if (!openGroup) return;
    const onDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpenGroup(null);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [openGroup]);

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

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  /** Pointer opens the panel too, but only once the pointer settles. */
  const onTriggerEnter = (label: string) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpenGroup(label), 90);
  };
  const onTriggerLeave = () => clearTimeout(hoverTimer.current);

  return (
    <>
      <header
        ref={headerRef}
        data-site-header
        data-scrolled={scrolled || openGroup ? "true" : "false"}
        onMouseLeave={() => {
          clearTimeout(hoverTimer.current);
          setOpenGroup(null);
        }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          "ease-[cubic-bezier(0.4,0,0.1,1)]",
          scrolled ? "py-2" : "py-4",
        )}
      >
        <div className="shell">
          {/* The floating capsule. It gains its ground once the page moves
              or a panel opens, and floats bare over the hero before that. */}
          <div
            className={cn(
              "relative flex items-center justify-between gap-4 rounded-full px-4 py-2 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.1,1)] sm:px-5 sm:py-2.5",
              scrolled || openGroup ? "glass shadow-[var(--shadow-md)]" : "bg-transparent",
            )}
          >
            <span className="text-[var(--hdr-fg)]">
              <Logo tone="inherit" />
            </span>

            <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
              {navGroups.map((group) => {
                const isOpen = openGroup === group.label;
                const holdsCurrent = group.items.some((i) => i.href === pathname);
                return (
                  <Fragment key={group.label}>
                  <button
                    ref={(el) => {
                      triggerRefs.current.set(group.label, el);
                    }}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId(group.label)}
                    onClick={() => setOpenGroup(isOpen ? null : group.label)}
                    onMouseEnter={() => onTriggerEnter(group.label)}
                    onMouseLeave={onTriggerLeave}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                      "text-[var(--hdr-fg-muted)] hover:bg-[var(--hdr-hover)] hover:text-[var(--hdr-fg)]",
                      (isOpen || holdsCurrent) && "text-[var(--hdr-fg)]",
                    )}
                  >
                    {group.label}
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "size-3.5 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.1,1)]",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  <MegaPanel
                    group={group}
                    open={isOpen}
                    pathname={pathname}
                    reduce={reduce}
                    onNavigate={() => setOpenGroup(null)}
                  />
                  </Fragment>
                );
              })}
            </nav>

            <div className="flex items-center gap-1 sm:gap-1.5">
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

              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign in to your account"
                className="hidden text-[var(--hdr-fg)] hover:bg-[var(--hdr-hover)] sm:inline-flex"
                asChild
              >
                <Link href="/auth">
                  <User />
                </Link>
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

      {/* ---------- Mobile drawer ----------
          Every group, every item — the drawer is the full site map, because
          on a phone it is the only navigation there is. */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[60] overflow-y-auto bg-ink-950 text-ivory-50"
            initial={reduce ? { opacity: 0 } : { clipPath: "circle(0% at 92% 6%)" }}
            animate={reduce ? { opacity: 1 } : { clipPath: "circle(145% at 92% 6%)" }}
            exit={reduce ? { opacity: 0 } : { clipPath: "circle(0% at 92% 6%)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="shell flex min-h-full flex-col py-6">
              <div className="flex items-center justify-between">
                <Logo inverted />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close menu"
                  className="text-ivory-50 hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  <X />
                </Button>
              </div>

              <nav aria-label="Mobile" className="mt-10 flex-1">
                {navGroups.map((group, gi) => (
                  <div key={group.label} className="mb-9">
                    <p className="eyebrow mb-4 text-brass-400">{group.label}</p>
                    <ul className="space-y-0.5">
                      {group.items.map((item, i) => {
                        const Icon = iconFor(item.icon);
                        return (
                          <motion.li
                            key={item.href}
                            initial={reduce ? false : { opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: 0.16 + gi * 0.04 + i * 0.03,
                              duration: 0.36,
                              ease: EASE_FLAT,
                            }}
                          >
                            <Link
                              href={item.href}
                              onClick={() => setMenuOpen(false)}
                              aria-current={pathname === item.href ? "page" : undefined}
                              className="flex items-center gap-3.5 rounded-[var(--radius)] py-2.5 transition-colors hover:text-brass-400"
                            >
                              <Icon aria-hidden className="size-4 shrink-0 text-brass-400/70" />
                              <span className="font-display text-2xl leading-none">
                                {item.label}
                              </span>
                              {item.badge && (
                                <span className="eyebrow rounded-full border border-brass-400/40 px-1.5 py-0.5 text-[0.5625rem] text-brass-300">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </div>
                ))}

                <div className="mb-9">
                  <p className="eyebrow mb-4 text-brass-400">Account</p>
                  <ul className="flex flex-wrap gap-x-5 gap-y-2">
                    {accountNav.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="text-sm text-ivory-50/75 transition-colors hover:text-ivory-50"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
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
