import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ConciergeWidget } from "@/components/ai/concierge-widget";
import { isConciergeLive } from "@/lib/ai";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Providers } from "@/components/providers";
import { fontVariableClasses, fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://discovermanipur.example"),
  title: {
    default: "Discover Manipur — The Land of Jewels",
    template: "%s · Discover Manipur",
  },
  description:
    "Floating islands, cloud-caught hills and a thousand-year weave. Plan your Manipur journey with local homestays, guided experiences, real food and an AI travel concierge.",
  keywords: [
    "Discover Manipur",
    "Manipur tourism",
    "Loktak Lake",
    "Imphal",
    "Northeast India travel",
    "Manipur homestays",
    "Sangai Festival",
  ],
  openGraph: {
    title: "Discover Manipur — The Land of Jewels",
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
      className={`${fontVariableClasses} h-full antialiased`}
      style={fontVariables}
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
        {/* Vercel Web Analytics (page views) and Speed Insights (Core Web
            Vitals from real visitors). Both render nothing, are cookieless and
            no-op off Vercel, so local dev and other hosts are unaffected. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
