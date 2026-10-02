"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronDown, Menu, Moon, Search, Sun, User, X } from "lucide-react";
import dynamic from "next/dynamic";
// eslint-disable-next-line no-restricted-imports -- deliberate: `prefetchFor` keeps viewport prefetch for static header links (menus render links only once opened) and none for dynamic ones; IntentLink would delay those to hover.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
  type FocusEvent,
} from "react";

import { Logo } from "@/components/layout/logo";
import { CatalogueImage } from "@/components/shared/catalogue-image";
import { Button } from "@/components/ui/button";
import { iconFor } from "@/lib/icons";
import { isDynamicHref } from "@/lib/prefetch-policy";
import { useMounted } from "@/lib/use-mounted";
import { accountNav, navGroups, type NavGroup } from "@/lib/nav";
import { cn } from "@/lib/utils";

import type { HeaderSearchDialog as HeaderSearchDialogComponent } from "./header-search-dialog";

type HeaderSearchDialogProps = ComponentProps<typeof HeaderSearchDialogComponent>;

/**
 * What the search button does when the dialog's chunk cannot be fetched.
 *
 * The header lives in the root layout, outside every `error.tsx`, so a lazy
 * chunk that fails to load (a deploy since this page was opened: the Hobby
 * plan has no Skew Protection, so the old chunk is gone; or a dropped
 * connection) would otherwise throw out of `React.lazy` and replace the whole
 * page with `global-error`. Instead the loader below resolves to this, which
 * sends the reader to the full `/search` page as a document load. That load
 * also picks up the current deployment, so its own chunks resolve. It renders
 * nothing and closes the dialog state straight away, so the next Ctrl/Cmd+K
 * tries again rather than toggling a dialog that is not there.
 */
function SearchPageFallback({ open, onOpenChange }: HeaderSearchDialogProps) {
  useEffect(() => {
    if (!open) return;
    onOpenChange(false);
    // A document load on purpose, not router.push: a client navigation would
    // ask the stale deployment for /search's chunks too.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/search");
  }, [open, onOpenChange]);
  return null;
}

/**
 * The search dialog, loaded on first use. `SearchInput` and the dialog chrome
 * are only needed once a reader asks for search, so they stay out of the
 * first-load JavaScript of every route. `warmSearch` starts the download when
 * the pointer reaches (or focus lands on) the search button, so by the time
 * the click arrives the chunk is usually already there. A failed download
 * degrades to `SearchPageFallback` rather than an error (see above); the
 * warm-up swallows its own failure, since the open path decides what to do.
 */
const HeaderSearchDialog = dynamic(
  () =>
    import("./header-search-dialog")
      .then((m) => m.HeaderSearchDialog)
      .catch(() => SearchPageFallback),
  { ssr: false },
);
const warmSearch = () => {
  import("./header-search-dialog").catch(() => undefined);
};

/**
 * The header's prefetch rule for its own links: `false` for dynamic or
 * proxied routes (`isDynamicHref`: search, community, auth, account, host
 * dashboard, admin), Next's default otherwise.
 *
 * A prefetch of one of those routes is not a CDN hit: it is a server render
 * or a proxy (Node function) invocation, spent before the reader has clicked
 * anything, for pages most readers never open. `prefetch={false}` keeps them
 * real `<a href>` links for crawlers, but in this Next (16) App Router it
 * turns prefetching off entirely, hover included; a click still navigates
 * client-side. Every other header link keeps the default, which prefetches as
 * the link comes into view. That matters here because the mega panels and the
 * drawer render their links only once opened, so "in view" already means the
 * reader asked for that menu. `IntentLink` (components/shared/intent-link.tsx)
 * would delay those prefetches until hover, so it is deliberately not used.
 */
function prefetchFor(href: string): false | undefined {
  return isDynamicHref(href) ? false : undefined;
}

/** How far the page moves before the header capsule takes on its glass. */
const SCROLLED_AT = 24;

/**
 * `window.scrollY > 24`, as an external store.
 *
 * A passive scroll listener, throttled to one read per animation frame;
 * React re-renders only when the boolean actually flips. The server snapshot
 * is `false` (the page always loads at the top as far as the server knows),
 * so hydration matches and a restored scroll position corrects itself on the
 * first frame.
 */
function subscribeScrolled(onChange: () => void): () => void {
  let frame = 0;
  const onScroll = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      onChange();
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    cancelAnimationFrame(frame);
  };
}
const getScrolled = () => window.scrollY > SCROLLED_AT;
const getScrolledServer = () => false;

/**
 * The browser-chrome colour for each theme: the page `--background` of that
 * theme (`--ivory-50` light, `--ink-950` dark in globals.css). The root
 * layout's `viewport.themeColor` ships the light value, since light is the
 * default theme, and its inline gate script switches the tag to the dark
 * value before first paint when the reader has dark saved. This keeps the
 * `<meta name="theme-color">` in step after that, when the reader switches.
 * The same two values are spelled out in that script (layout.tsx).
 */
const THEME_COLOR = { light: "#fbf8f3", dark: "#0e0c0b" } as const;

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
  onNavigate,
}: {
  group: NavGroup;
  open: boolean;
  pathname: string;
  onNavigate: () => void;
}) {
  // A plain element, present only while open. `mega-in` (globals.css) fades it
  // in with an 8 px drop; reduced motion gets no entrance. Closing is instant,
  // which is also what a reader dismissing a menu expects.
  if (!open) return null;

  return (
    <div
      id={panelId(group.label)}
      className="mega-in absolute left-0 right-0 top-full z-10 hidden pt-3 lg:block"
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
                      prefetch={prefetchFor(item.href)}
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
              prefetch={prefetchFor(group.feature.href)}
              onClick={() => onNavigate()}
              className="group/feature relative hidden overflow-hidden rounded-[var(--radius)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:block"
            >
              <CatalogueImage
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
    </div>
  );
}

/**
 * The site chrome.
 *
 * The mega menu exists to surface the whole site at once: the 3D explorer,
 * the host funnel, search and sign-in all need an entry point here. Each panel
 * is a real disclosure rather than a `:hover`/`:focus-within` dropdown, so it
 * opens from a keyboard and behaves predictably on touch: click, Enter/Space,
 * Escape, outside-click and following a link all close it.
 *
 * No animation library: the panel, the mobile drawer and its staggered items
 * animate in CSS (`mega-in`, `site-drawer`, `drawer-item` in globals.css),
 * each with a reduced-motion rule, so this component ships no motion runtime
 * on every route.
 */
export function SiteHeader() {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  /** The search chunk mounts on the first open and then stays, so closing
   *  still plays the dialog's exit animation and reopening is instant. */
  const [searchMounted, setSearchMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const scrolled = useSyncExternalStore(subscribeScrolled, getScrolled, getScrolledServer);
  const mounted = useMounted();

  const headerRef = useRef<HTMLElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  /** Mirrors `searchOpen` for the callbacks below, which must not re-create
   *  (the Ctrl/Cmd+K listener holds `openSearch`). Written only in handlers. */
  const searchOpenRef = useRef(false);
  /** What held focus when search opened, so closing can hand it back. */
  const searchReturnFocus = useRef<HTMLElement | null>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement | null>());
  /** Pointer-intent timer, so the panel does not flicker between triggers. */
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // A new page closes the drawer and any open panel. Links close them on
  // click already; this is the backstop for back/forward and programmatic
  // navigation. Adjusted during render (React's "storing information from
  // previous renders" pattern) rather than in an effect, so there is no
  // extra commit with a stale open menu over the new page.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
    setOpenGroup(null);
  }

  const closePanel = useCallback((restoreFocusTo?: string) => {
    setOpenGroup(null);
    if (restoreFocusTo) triggerRefs.current.get(restoreFocusTo)?.focus();
  }, []);

  const setSearch = useCallback((open: boolean) => {
    searchOpenRef.current = open;
    setSearchOpen(open);
  }, []);

  /**
   * Opens (or, given an updater, toggles) search. On the way in it notes what
   * held focus: the dialog has no Radix `Trigger`, so Radix has nothing to
   * return focus to on close and would drop it on <body>.
   */
  const openSearch = useCallback(
    (next: boolean | ((open: boolean) => boolean)) => {
      const opening = typeof next === "function" ? next(searchOpenRef.current) : next;
      if (opening && !searchOpenRef.current) {
        const active = document.activeElement;
        searchReturnFocus.current =
          active instanceof HTMLElement && active !== document.body ? active : null;
      }
      setSearchMounted(true);
      setSearch(opening);
    },
    [setSearch],
  );

  /**
   * The dialog's `onCloseAutoFocus`: back to whatever held focus before it
   * opened, or to the search button when that was <body> or has since left
   * the document (a result link closes the dialog as it navigates).
   */
  const restoreSearchFocus = useCallback((event: Event) => {
    event.preventDefault();
    const back = searchReturnFocus.current;
    searchReturnFocus.current = null;
    (back?.isConnected ? back : searchButtonRef.current)?.focus();
  }, []);

  /**
   * Keyboard focus leaving the open panel (Tab past its last link, Shift+Tab
   * back past its trigger) closes it, so a panel never hangs open over the
   * page while focus is somewhere else. Only a move to a known element counts:
   * `relatedTarget` is null when a click lands on something unfocusable (the
   * panel's own text, say) or the window loses focus, and neither should
   * dismiss the menu. Outside clicks have their own listener below.
   */
  const onNavBlur = (event: FocusEvent<HTMLElement>) => {
    if (!openGroup) return;
    const next = event.relatedTarget;
    if (!(next instanceof Node)) return;
    const trigger = triggerRefs.current.get(openGroup);
    const panel = document.getElementById(panelId(openGroup));
    const within = (node: Node) => !!trigger?.contains(node) || !!panel?.contains(node);
    if (!within(event.target) || within(next)) return;
    setOpenGroup(null);
  };

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
        openSearch((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch]);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  // Keep the browser chrome in the active theme's background. Re-applied on
  // navigation too, in case the metadata tags are re-rendered with the
  // layout's light default.
  useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLOR[resolvedTheme]);
  }, [resolvedTheme, pathname]);

  /** Pointer opens the panel too, but only once the pointer settles. */
  const onTriggerEnter = (label: string) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpenGroup(label), 90);
  };
  const onTriggerLeave = () => clearTimeout(hoverTimer.current);

  return (
    /* The drawer's Radix root wraps the whole header only so the Menu button
       can be its `Trigger` (which wires `aria-controls`, `aria-expanded` and
       focus return on close). It renders no element of its own. */
    <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
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

            <nav aria-label="Main" onBlur={onNavBlur} className="hidden items-center gap-0.5 lg:flex">
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
                      onNavigate={() => setOpenGroup(null)}
                    />
                  </Fragment>
                );
              })}
            </nav>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <Button
                ref={searchButtonRef}
                variant="ghost"
                size="icon"
                aria-label="Search Manipur"
                aria-haspopup="dialog"
                className="text-[var(--hdr-fg)] hover:bg-[var(--hdr-hover)]"
                onPointerEnter={warmSearch}
                onFocus={warmSearch}
                onClick={() => openSearch(true)}
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
                <Link href="/auth" prefetch={prefetchFor("/auth")}>
                  <User />
                </Link>
              </Button>

              <Button variant="primary" size="pill" className="hidden sm:inline-flex" asChild>
                <Link href="/plan">Plan my trip</Link>
              </Button>

              <DialogPrimitive.Trigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[var(--hdr-fg)] hover:bg-[var(--hdr-hover)] lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu />
                </Button>
              </DialogPrimitive.Trigger>
            </div>
          </div>
        </div>
      </header>

      {searchMounted && (
        <HeaderSearchDialog
          open={searchOpen}
          onOpenChange={setSearch}
          onCloseAutoFocus={restoreSearchFocus}
        />
      )}

      {/* ---------- Mobile drawer ----------
          Every group, every item: the drawer is the full site map, because
          on a phone it is the only navigation there is.

          A modal Radix dialog, full screen: it traps focus, closes on Escape,
          hides the page behind it from assistive tech, locks the page scroll
          and returns focus to the Menu button on close. The circle wipe and
          the item stagger are CSS animations keyed to `data-state` (Radix
          keeps the content mounted until the exit animation ends), and
          reduced motion lands straight on the end state. */}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-modal="true"
          aria-describedby={undefined}
          data-lenis-prevent
          className="site-drawer fixed inset-0 z-[60] overflow-y-auto bg-ink-950 text-ivory-50 focus:outline-none"
        >
          <DialogPrimitive.Title className="sr-only">Site menu</DialogPrimitive.Title>
          <div className="shell flex min-h-full flex-col py-6">
            <div className="flex items-center justify-between">
              <Logo inverted />
              <DialogPrimitive.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close menu"
                  className="text-ivory-50 hover:bg-white/10"
                >
                  <X />
                </Button>
              </DialogPrimitive.Close>
            </div>

            <nav aria-label="Mobile" className="mt-10 flex-1">
              {navGroups.map((group, gi) => (
                <div key={group.label} className="mb-9">
                  <p className="eyebrow mb-4 text-brass-400">{group.label}</p>
                  <ul className="space-y-0.5">
                    {group.items.map((item, i) => {
                      const Icon = iconFor(item.icon);
                      return (
                        <li
                          key={item.href}
                          className="drawer-item"
                          style={{ "--drawer-delay": `${160 + gi * 40 + i * 30}ms` } as CSSProperties}
                        >
                          <Link
                            href={item.href}
                            prefetch={prefetchFor(item.href)}
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
                        </li>
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
                        prefetch={prefetchFor(item.href)}
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
              <Link href="/plan" onClick={() => setMenuOpen(false)}>
                Plan my trip
              </Link>
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
