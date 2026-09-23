import type { Metadata, Viewport } from "next";
import {
  Figtree,
  JetBrains_Mono,
  Newsreader,
  Noto_Sans_Meetei_Mayek,
  Noto_Serif_Devanagari,
} from "next/font/google";
import { Toaster } from "sonner";

import { ConciergeWidget } from "@/components/ai/concierge-widget";
import { isConciergeLive } from "@/lib/ai";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Providers } from "@/components/providers";
import "./globals.css";

// Body voice. Figtree is a humanist geometric: tall x-height, round open
// bowls, no quirky letterforms to trip over. It is the half of the system
// doing the actual reading work, so it also carries the micro-labels.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  display: "swap",
});

// Display voice. Newsreader is a low-contrast oldstyle drawn for long-form
// reading — warm where a didone is sharp. Its `opsz` axis is the point: the
// same family opens up at hero scale and tightens at pull-quote scale, so
// headings stay calm instead of brittle.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

// Mono is now reserved for genuinely machine-ish text — booking references,
// coordinates, application ids. The uppercase section labels moved to Figtree:
// a code face read "terminal" everywhere it was used as decoration.
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

// The hero cycles the state's name through the three scripts it is actually
// written in, so Devanagari needs a real face — without one मणिपुर falls back
// to a system font and sits visibly apart from the other two. A serif, to
// answer Newsreader rather than fight it.
const devanagari = Noto_Serif_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  display: "swap",
});

const mayek = Noto_Sans_Meetei_Mayek({
  variable: "--font-mayek",
  subsets: ["meetei-mayek"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://manipurtourism.example"),
  title: {
    default: "Manipur Tourism — The Land of Jewels",
    template: "%s · Manipur Tourism",
  },
  description:
    "Floating islands, cloud-caught hills and a thousand-year weave. Plan your Manipur journey with local homestays, guided experiences, real food and an AI travel concierge.",
  keywords: [
    "Manipur tourism",
    "Loktak Lake",
    "Imphal",
    "Northeast India travel",
    "Manipur homestays",
    "Sangai Festival",
  ],
  openGraph: {
    title: "Manipur Tourism — The Land of Jewels",
    description:
      "Floating islands, cloud-caught hills and a thousand-year weave. Plan your Manipur journey.",
    type: "website",
    locale: "en_IN",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1414" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${figtree.variable} ${newsreader.variable} ${mono.variable} ${mayek.variable} ${devanagari.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="flex-1 scroll-mt-28 md:scroll-mt-32">
            {children}
          </main>
          <SiteFooter />
          <ConciergeWidget live={isConciergeLive} />
          <Toaster position="top-center" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
