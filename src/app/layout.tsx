import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Toaster } from "sonner";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ConciergeWidget } from "@/components/ai/concierge-widget";
// The dependency-free flags module, not the `@/lib/ai` barrel: the barrel
// pulls the tools, both provider SDKs and zod into every server render.
import { isConciergeLive } from "@/lib/ai/flags";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { RevealReady } from "@/components/motion/reveal";
import { Providers } from "@/components/providers";
import { SITE_URL } from "@/lib/site";
import { fontVariableClasses, fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Discover Manipur: The Land of Jewels",
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
    title: "Discover Manipur: The Land of Jewels",
    description:
      "Floating islands, cloud-caught hills and a thousand-year weave. Plan your Manipur journey.",
    type: "website",
    locale: "en_IN",
  },
};

/**
 * One browser-chrome colour, the default (light) theme's `--background`
 * (`--ivory-50` in globals.css). It used to follow the OS colour scheme, but
 * the site does not: it opens in light whatever the OS says, so a dark-mode
 * phone painted near-black chrome over an ivory page. A reader with dark
 * saved gets the dark value before first paint (`PRE_PAINT_SCRIPT` below),
 * and when a reader switches theme the header's toggle updates it to match.
 */
export const viewport: Viewport = {
  themeColor: "#fbf8f3",
};

/**
 * The dark theme's browser-chrome colour, `--ink-950` in globals.css. The
 * same value as `THEME_COLOR.dark` in site-header.tsx, which cannot be
 * imported here: that is a client module, and a Server Component importing a
 * constant from one gets a client reference, not the string.
 */
const DARK_THEME_COLOR = "#0e0c0b";

/**
 * Runs at the very top of <body>, before anything below it is parsed or
 * painted. Plain ES5, since it runs before any polyfill could.
 *
 * 1. It adds `js` to <html>, the class the scroll-reveal hidden state hangs
 *    off (globals.css), so a reader without JavaScript never gets it and sees
 *    every section.
 *
 * 2. Browser chrome for a saved dark theme. next-themes keeps the choice in
 *    `localStorage["theme"]` as the bare theme name (`defaultTheme` light,
 *    `enableSystem` off, so the value is "light", "dark" or absent). For
 *    "dark" it inserts a dark `<meta name="theme-color">` AHEAD of the
 *    layout's light one: the browser uses the first in tree order, and the
 *    light tag stays exactly as the server rendered it. Editing that tag in
 *    place does not hydrate cleanly: React 19 matches hoisted `<meta>` tags
 *    by their `content` (react-dom's hoistable cache), so a changed one is
 *    not recognised and React appends a second, light tag of its own. React
 *    leaves the inserted tag alone (it claims only tags it matches), and the
 *    header's effect then keeps "the first theme-color tag" (this one) in
 *    step with later switches. Storage can throw (blocked site data), in
 *    which case the chrome stays light until hydration, as before.
 *
 * 3. Scroll reveals without waiting for hydration. At DOMContentLoaded it
 *    marks every reveal already on screen (or above it) `data-revealed=
 *    "instant"`, which shows it with no entrance, and watches the rest with
 *    its own IntersectionObserver, using the same margins as the component
 *    (`-80px` for `Reveal`, `-60px` for `RevealText`). On a slow device the
 *    fold's reveals, such as the /search results and the /contact form, used
 *    to stay blank until React had hydrated and attached its observer.
 *    Elements without a box (inside something hidden) are left to the
 *    observer, so they still rise when they are shown. Without
 *    IntersectionObserver everything is revealed at once. Elements mounted
 *    later by client navigation are observed by the component as before; an
 *    element both observers watch is revealed once, by whichever fires
 *    first, since neither overwrites an existing `data-revealed`.
 *
 * 4. Shortly after `load` (which the page's async chunks hold up), it checks
 *    that React has hydrated (`RevealReady` sets `data-reveal-ready`). If
 *    not, the JavaScript failed and it drops `js` again, so a reader whose
 *    chunks were blocked sees every section, below the fold included.
 *
 * `<html>` carries `suppressHydrationWarning`, the same mechanism
 * next-themes relies on for its class, so React leaves the extra class and
 * attribute alone; the reveal elements carry it for `data-revealed`. A plain
 * inline script rather than `next/script` `beforeInteractive`: it has to run
 * before first paint, and the CSP allows inline scripts.
 */
const PRE_PAINT_SCRIPT = `(function(){
var d=document.documentElement;
d.classList.add("js");
try{if(localStorage.getItem("theme")==="dark"){
var m=document.querySelector('meta[name="theme-color"]'),n=document.createElement("meta");
n.setAttribute("name","theme-color");n.setAttribute("content","${DARK_THEME_COLOR}");
if(m&&m.parentNode)m.parentNode.insertBefore(n,m);else document.head.appendChild(n);
}}catch(e){}
function watch(sel,margin){
var els=document.querySelectorAll(sel),io=null,i,el,r;
for(i=0;i<els.length;i++){
el=els[i];
if(el.hasAttribute("data-revealed"))continue;
r=el.getBoundingClientRect();
if(typeof IntersectionObserver==="undefined"||((r.width||r.height)&&r.top<innerHeight)){el.setAttribute("data-revealed","instant");continue}
io=io||new IntersectionObserver(function(es,o){for(var j=0;j<es.length;j++){if(!es[j].isIntersecting)continue;if(!es[j].target.hasAttribute("data-revealed"))es[j].target.setAttribute("data-revealed","");o.unobserve(es[j].target)}},{rootMargin:margin});
io.observe(el);
}
}
function scan(){watch("[data-reveal]","-80px");watch("[data-reveal-text]","-60px")}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",scan);else scan();
addEventListener("load",function(){setTimeout(function(){if(!d.hasAttribute("data-reveal-ready"))d.classList.remove("js")},3000)});
})();`;

/**
 * Microsoft Clarity (heatmaps and session replay) records only the live
 * site. `VERCEL_ENV` is read at build time (this is a Server Component and
 * the value is fixed per deployment): previews, forks and local builds are
 * all `NODE_ENV=production`, which is why the old check let them record into
 * the production project. Private areas carry `data-clarity-mask`.
 */
const recordWithClarity = process.env.VERCEL_ENV === "production";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontVariableClasses} h-full antialiased`}
      style={fontVariables}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
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
          <RevealReady />
        </Providers>
        {/* Vercel Web Analytics (page views) and Speed Insights (Core Web
            Vitals from real visitors). Both render nothing, are cookieless and
            no-op off Vercel, so local dev and other hosts are unaffected. */}
        <Analytics />
        <SpeedInsights />
        {/* Microsoft Clarity (heatmaps and session replay). Production
            deployment only (see `recordWithClarity`), and `lazyOnload`, so it
            loads in idle time after the page has loaded instead of competing
            with hydration. The project id is public by design; it ships in
            the page either way. */}
        {recordWithClarity && (
          <Script id="microsoft-clarity" strategy="lazyOnload">
            {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "ynglu4hcsv");`}
          </Script>
        )}
      </body>
    </html>
  );
}
