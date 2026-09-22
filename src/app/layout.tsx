import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Geist, JetBrains_Mono, Noto_Sans_Meetei_Mayek } from "next/font/google";
import { Toaster } from "sonner";

import { ConciergeWidget } from "@/components/ai/concierge-widget";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Bodoni is the display voice: a didone with extreme thick/thin
// contrast that only works at size. `opsz` is what keeps the hairlines
// from disappearing at hero scale.
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

// Mono carries every uppercase micro-label: section tags, indices,
// dates, coordinates, stat units.
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
      className={`${geistSans.variable} ${bodoni.variable} ${mono.variable} ${mayek.variable} h-full antialiased`}
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
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <ConciergeWidget />
          <Toaster position="top-center" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
