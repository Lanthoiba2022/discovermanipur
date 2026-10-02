"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { SmoothScroll } from "@/components/motion/smooth-scroll";

/**
 * Client-side context shared by every page: the colour theme and Lenis smooth
 * scrolling. This component wraps the whole tree from the root layout, so
 * whatever it imports ships in the first-load JS of every route; keep it to
 * what each page actually needs.
 *
 * There used to be a TanStack Query client here as well, but nothing ever
 * called `useQuery` or `useMutation`, so it was a runtime and a provider on
 * every page for no consumer. Data comes from Server Components and Server
 * Actions; if a feature ever needs client-side fetching with a cache, add the
 * provider back in that feature's own subtree rather than here.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <SmoothScroll>{children}</SmoothScroll>
    </ThemeProvider>
  );
}
