import { AlertTriangle, Bus, FileText, Globe2, Plane, TrainFront } from "lucide-react";

interface Panel {
  icon: typeof Plane;
  title: string;
  body: string[];
}

const PANELS: Panel[] = [
  {
    icon: Plane,
    title: "Flying in",
    body: [
      "Imphal's Bir Tikendrajit International Airport (Tulihal), about 8 km from the city centre, is the only airport in Manipur with scheduled passenger flights.",
      "Direct services usually connect Imphal with Delhi, Kolkata and Guwahati, with onward hops to Silchar, Dimapur and Aizawl. Routes and frequencies change every season — check the airlines directly before you plan around one.",
      "Prepaid and app cabs run from the terminal into Imphal; agree a fare before you get in if you are taking a private taxi.",
    ],
  },
  {
    icon: Bus,
    title: "Coming by road",
    body: [
      "NH-2 links Imphal with Dimapur in Nagaland — roughly 215 km, usually 7 to 9 hours depending on landslides, convoys and roadworks.",
      "NH-37 runs west through Noney and Jiribam towards Silchar in Assam, about 220 km; Guwahati is a longer haul again, typically an overnight run via Silchar or Dimapur.",
      "Overnight sleeper buses and shared vehicles work both corridors. Hill roads are slow in the monsoon (June to September) — build a buffer day into any tight itinerary.",
    ],
  },
  {
    icon: TrainFront,
    title: "Trains and shared sumos",
    body: [
      "The nearest working railheads are Dimapur in Nagaland and Jiribam on Manipur's western edge; the Jiribam–Imphal line is still under construction, so confirm its status rather than assuming a through train.",
      "Shared Tata Sumos and Boleros are how most of Manipur actually moves: fixed stands, per-seat fares, and departures early in the morning once the vehicle fills.",
      "Book a seat the evening before for popular routes such as Imphal–Ukhrul, Imphal–Churachandpur or Imphal–Senapati, and expect a squeeze — the back row is the one to avoid.",
    ],
  },
  {
    icon: FileText,
    title: "Inner Line Permit — Indian visitors",
    body: [
      "Manipur was brought under the Inner Line Permit system with effect from 1 January 2020. Indian citizens who are not domiciled in Manipur need an ILP to enter the state.",
      "Permits are issued online through the Manipur government's ILP portal and at counters at Imphal airport and the main entry points. Categories (temporary, regular, special, labour), validity and fees differ — a short tourist permit is typically valid for a limited number of days and can usually be extended.",
      "Carry a printed copy plus the ID you applied with; permits are checked on arrival and at some district boundaries.",
    ],
  },
  {
    icon: Globe2,
    title: "Foreign nationals — a separate rule",
    body: [
      "The ILP does not apply to foreign passport holders. Manipur instead falls under the Protected Area regime, which the Ministry of Home Affairs reinstated for Manipur, Mizoram and Nagaland in December 2024, so a Protected Area Permit is generally required.",
      "Nationals of Afghanistan, China and Pakistan, and people of those origins, need prior clearance from the Ministry of Home Affairs.",
      "Foreign visitors are also required to register with the Foreigners Regional Registration Office (FRRO) in Imphal shortly after arrival — within 24 hours under the current rules.",
    ],
  },
];

export function GettingAround() {
  return (
    <section
      aria-labelledby="getting-around-heading"
      className="rounded-[var(--radius-lg)] border border-border bg-surface-sunken p-6 md:p-10"
    >
      <p className="eyebrow flex items-center gap-3 text-muted-foreground">
        <span className="weave-rule inline-block h-[3px] w-10 rounded-full" />
        Practical
      </p>
      <h2 id="getting-around-heading" className="font-display mt-4 text-3xl md:text-4xl">
        Reaching Manipur, and moving around it
      </h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
        Manipur is a valley ringed by hills, and almost every journey is longer than the map
        suggests. Here is the honest version of how people get in and get about.
      </p>

      <ul className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {PANELS.map((panel) => {
          const Icon = panel.icon;
          return (
            <li
              key={panel.title}
              className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-surface p-5"
            >
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <h3 className="font-display text-xl">{panel.title}</h3>
              {panel.body.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="text-sm leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </li>
          );
        })}
      </ul>

      <p className="mt-8 flex items-start gap-3 rounded-[var(--radius)] border border-warning/40 bg-warning/10 p-5 text-sm leading-relaxed">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
        <span>
          <strong className="font-medium">Verify before you travel.</strong> Permit rules, fees and
          validity in the North East change often, and road access can be affected by weather,
          repairs or local restrictions. Confirm the current position with the Manipur government&rsquo;s
          official ILP portal, the Ministry of Home Affairs, the FRRO in Imphal or your nearest
          Indian mission, and check current travel advisories, before booking anything.
        </span>
      </p>
    </section>
  );
}
