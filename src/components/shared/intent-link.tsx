"use client";

import Link from "next/link";
import { useState, type ComponentProps, type FocusEvent, type PointerEvent, type TouchEvent } from "react";

import { isDynamicHref } from "@/lib/prefetch-policy";

type LinkProps = ComponentProps<typeof Link>;

export type IntentLinkProps = Omit<LinkProps, "prefetch"> & {
  /**
   * Prefetch once the visitor shows intent (pointer over it, keyboard focus,
   * a finger down). `false` never prefetches. Defaults to `true`, except for
   * hrefs `isDynamicHref` flags, where even a hover prefetch costs a function
   * invocation.
   */
  intent?: boolean;
};

function hrefPath(href: LinkProps["href"]): string {
  return typeof href === "string" ? href : (href.pathname ?? "");
}

/**
 * A `next/link` that prefetches on intent rather than on sight.
 *
 * By default every `<Link>` prefetches its route as it scrolls into view
 * (node_modules/next/dist/docs/01-app/02-guides/prefetching.md). On a
 * listing of 159 cards, or a footer of thirty links on every page, that is
 * hundreds of requests for pages nobody opens, each one an edge request, and
 * for a dynamic route a function invocation. This is the guide's
 * "Hover-triggered prefetch" pattern: start with `prefetch={false}` and switch
 * to the default (`null`) the first time the visitor points at, focuses or
 * touches the link. Once armed it stays armed.
 *
 * `prefetch={false}` turns off hover prefetching too in the App Router, which
 * is why the switch is ours rather than Next's. Touch devices get
 * `touchstart`, which fires a beat before the click, so a tap still lands on
 * a warm route more often than not.
 *
 * It renders exactly the anchor `<Link>` renders, a plain crawlable
 * `<a href>`, and forwards every prop (including a `ref` from a Radix `Slot`
 * when used under `Button asChild`). Caller handlers run before arming.
 */
export function IntentLink({
  intent,
  onPointerEnter,
  onFocus,
  onTouchStart,
  ...props
}: IntentLinkProps) {
  const allowed = intent ?? !isDynamicHref(hrefPath(props.href));
  const [armed, setArmed] = useState(false);

  const arm = () => {
    if (allowed && !armed) setArmed(true);
  };

  return (
    <Link
      {...props}
      prefetch={allowed && armed ? null : false}
      onPointerEnter={(event: PointerEvent<HTMLAnchorElement>) => {
        onPointerEnter?.(event);
        arm();
      }}
      onFocus={(event: FocusEvent<HTMLAnchorElement>) => {
        onFocus?.(event);
        arm();
      }}
      onTouchStart={(event: TouchEvent<HTMLAnchorElement>) => {
        onTouchStart?.(event);
        arm();
      }}
    />
  );
}
