/**
 * Yening — editorial page content.
 *
 * Single source of truth for the copy that used to sit inline in page and
 * component files. `npm run db:seed` pushes all of it into `site_sections`,
 * and the data layer reads it back, so a wording fix is a content change
 * rather than a deploy.
 *
 * Icons are lucide-react *names*, not component references: a component
 * cannot survive a round trip through jsonb. `@/lib/icons` maps them back.
 */

import type { IconName } from "@/lib/icons";

export interface IconCard {
  icon: IconName;
  title: string;
  body: string;
}

export interface NamedIconCard {
  icon: IconName;
  name: string;
  body: string;
}

export interface ImageItem {
  src: string;
  alt: string;
}

export interface Principle {
  title: string;
  body: string;
}

export interface QaItem {
  q: string;
  a: string;
}

export interface Channel {
  icon: IconName;
  label: string;
  value: string;
  detail: string;
}

export interface Stat {
  value: number;
  suffix: string;
  label: string;
  note: string;
}

export interface QuickAsk {
  label: string;
  detail: string;
}

/** Home — the opening statement. */
export const homeStatement =
  "Manipur sits in a bowl of blue hills on India's eastern edge. The valley floods into a lake, the lake grows islands, the islands carry forest, and the forest hides a deer that lives nowhere else on earth. Everything here is layered — and every layer is still lived in.";

/** About — the six programme themes. */
export const aboutThemes: NamedIconCard[] = [
  {
    icon: "Smartphone",
    name: "Smart & Digital Tourism",
    body: "One place to find a stay, a route, a meal and a guide — instead of five WhatsApp groups and a search engine that has never heard of your village.",
  },
  {
    icon: "Landmark",
    name: "Heritage & Culture",
    body: "Ras Leela, Thang-Ta, the polo ground, the handloom and the histories behind them, written out properly rather than reduced to a caption.",
  },
  {
    icon: "Leaf",
    name: "Sustainable & Eco-Tourism",
    body: "A responsible-travel layer that names the real pressures on Loktak, on the hills and on host communities, and asks visitors to travel accordingly.",
  },
  {
    icon: "Compass",
    name: "Tourist Experience",
    body: "Planning that reads like a friend explaining the trip: what a place costs, how long it takes, when to come, and what to do when plans change.",
  },
  {
    icon: "Sparkles",
    name: "AI, AR & Emerging Tech",
    body: "An AI concierge that drafts an itinerary from your dates and interests, and immersive views of places most visitors have only seen in photographs.",
  },
  {
    icon: "Accessibility",
    name: "Accessibility & Multilingual",
    body: "WCAG 2.1 AA as a build target, honest accessibility notes on each place, and Meetei Mayek alongside English where it belongs.",
  },
];

/** About — editorial principles. */
export const aboutPrinciples: Principle[] = [
  {
    title: "Say what we know",
    body: "Prices, timings and permit rules change. Where we are not certain, we say so and point you at the official source rather than inventing a number.",
  },
  {
    title: "The host keeps the guest",
    body: "Homestays and experiences are listed under the name of the family or the guide who runs them, with their story attached, not flattened into a brand.",
  },
  {
    title: "Nothing borrowed from elsewhere",
    body: "Manipur is not a stand-in for a more famous destination. The writing, the palette and the photographs come from the place itself.",
  },
  {
    title: "Built to be handed over",
    body: "A demonstration site is only useful if someone can keep running it. The data layer, the content and the design tokens are separated so they can be.",
  },
];

/** Host landing — why list with Yening. */
export const hostWhy: IconCard[] = [
  {
    icon: "BadgeCheck",
    title: "Income that stays in the leikai",
    body: "Ninety per cent of what a guest pays reaches you. No agent between your gate and the traveller, and no commission stacked on commission.",
  },
  {
    icon: "CalendarRange",
    title: "You keep control",
    body: "Your rate, your calendar, your house rules, your guests. Block a festival week or a family function and nothing can be booked on it.",
  },
  {
    icon: "Megaphone",
    title: "Manipur, told properly",
    body: "Guests arrive already knowing what eromba is, why the phumdi float and that Ukhrul is four hours away. Fewer surprises for them, fewer arguments for you.",
  },
];

/** Host landing — what Yening takes care of. */
export const hostWeHandle: IconCard[] = [
  {
    icon: "Camera",
    title: "Photography and your listing page",
    body: "A Manipur Tourism photographer visits once, free, and we write your listing with you — in Meiteilon, Hindi or English.",
  },
  {
    icon: "ShieldCheck",
    title: "Verified guests and a safety line",
    body: "Every traveller is ID-verified before booking. A district coordinator is reachable by phone for the whole stay.",
  },
  {
    icon: "Languages",
    title: "Translation, both ways",
    body: "Guest messages arrive in your language and your replies reach them in theirs. You never have to write in English.",
  },
  {
    icon: "LifeBuoy",
    title: "Payments, cancellations and disputes",
    body: "We collect the money, release your payout within five working days, and mediate if something goes wrong.",
  },
];

/** Host landing — gallery strip. */
export const hostGallery: ImageItem[] = [
  {
    src: "/file-uploads/h111.avif",
    alt: "Courtyard of a traditional Meitei house with a tin roof and a low veranda",
  },
  { src: "/file-uploads/manipur-chillies.webp", alt: "A heap of fresh red and green chillies, the backbone of a Manipuri kitchen" },
  { src: "/file-uploads/phanek.jpeg", alt: "Striped phanek cloth taking shape on a loin loom" },
  { src: "/file-uploads/imafoo.jpg", alt: "Vendor sorting fresh greens at the Ima Keithel market" },
  { src: "/file-uploads/pottery.jpg", alt: "Hands shaping a clay pot by the coil-and-beat method at Andro" },
  { src: "/file-uploads/h112.avif", alt: "Timber loft bedroom with woven mats and a shuttered window" },
];

/** Host landing — how it works, in four steps. */
export const hostSteps: IconCard[] = [
  {
    icon: "ClipboardList",
    title: "Tell us what you have",
    body: "Fifteen minutes, four short steps. A room, a kitchen table, a loom, a route you have walked since childhood — that is enough to start.",
  },
  {
    icon: "Handshake",
    title: "We visit and verify",
    body: "Someone from the Manipur Tourism district team calls within three working days and visits within two weeks. We check safety and water, and help you photograph the place properly.",
  },
  {
    icon: "CalendarCheck",
    title: "You go live and set the rules",
    body: "Your price, your calendar, your house rules. Block the days of a family shraddha or Yaoshang and nobody can book them.",
  },
  {
    icon: "Wallet",
    title: "Guests arrive, you get paid",
    body: "Payouts reach your bank account within five working days of checkout. Manipur Tourism keeps 10%, stated up front, and nothing else.",
  },
];

/** Host landing — questions hosts actually ask. */
export const hostFaqs: QaItem[] = [
  {
    q: "Do I need a registered guest house or a licence?",
    a: "Not to apply. A homestay with up to six rooms is treated as a home enterprise in Manipur, and our district team will tell you exactly which municipal or village-council paper you need before you go live — and help you get it.",
  },
  {
    q: "What does Manipur Tourism actually take?",
    a: "Ten per cent of what a guest pays, deducted at payout. There is no listing fee, no photography fee and no charge for the district visit. If we ever add a charge, we will tell you before it applies to a booking you have taken.",
  },
  {
    q: "I do not speak much English. Can I still host?",
    a: "Yes. Your listing can be written in Meiteilon or Hindi and we translate it. Guest messages are translated both ways, and the district team can join a call if a guest needs something explained.",
  },
  {
    q: "What if a guest damages something?",
    a: "Report it within 48 hours of checkout with photos. Manipur Tourism mediates, holds the guest liable for repair or replacement, and can bar a guest from the platform. We do not take a host's side or a guest's side before both have been heard.",
  },
  {
    q: "Can I block dates for family or festival days?",
    a: "Always. Your calendar is yours. Block Yaoshang, Ningol Chakouba, a shraddha or a wedding and nobody can book those nights. Blocking dates never affects your ranking.",
  },
  {
    q: "How long does approval take?",
    a: "A call within three working days and a district visit within two weeks. Most applications are decided within twenty days. If we say no, you get a written reason and can reapply once it is fixed.",
  },
  {
    q: "Do I have to serve food?",
    a: "No. Many hosts offer only a room, some offer only a meal, and some only a walk. You list what you actually want to do and price it yourself.",
  },
  {
    q: "When do I get paid?",
    a: "Within five working days of the guest checking out, straight to your bank account by NEFT. You can see every upcoming payout in your host dashboard.",
  },
];

/** Contact — where each kind of message goes. */
export const contactChannels: Channel[] = [
  {
    icon: "Mail",
    label: "General enquiries",
    value: "hello@example.com",
    detail: "Placeholder address for the prototype — use the form and it reaches the same place.",
  },
  {
    icon: "Home",
    label: "Hosting",
    value: "hosts@example.com",
    detail: "Homestays, experiences, guiding and transport. Nothing is being onboarded yet.",
  },
  {
    icon: "ShieldAlert",
    label: "Accessibility",
    value: "access@example.com",
    detail: "Something on the site you cannot use? This goes to the top of the pile.",
  },
  {
    icon: "MapPin",
    label: "Where we are",
    value: "Imphal, Manipur (remote team)",
    detail: "No public office. We have not invented a street address for a demonstration project.",
  },
];

/** Home — the four counted facts. */
export const homeStats: Stat[] = [
  {
    value: 287,
    suffix: " km²",
    label: "Loktak Lake",
    note: "The largest freshwater lake in North East India, floored with floating phumdi islands.",
  },
  {
    value: 1,
    suffix: "",
    label: "Floating national park",
    note: "Keibul Lamjao is the world's only floating national park — and the last wild home of the sangai.",
  },
  {
    value: 5000,
    suffix: "+",
    label: "Ima Keithel traders",
    note: "Asia's largest market run entirely by women, held in the heart of Imphal for centuries.",
  },
  {
    value: 34,
    suffix: "",
    label: "Recognised tribes",
    note: "Thirty-four Scheduled Tribes across sixteen districts, each with its own weave and calendar.",
  },
];

/** Home — scrolling word strip. */
export const marqueeWords: string[] = [
  "Loktak",
  "Sangai",
  "Ima Keithel",
  "Yaoshang",
  "Chak-hao",
  "Shirui Kashong",
  "Kangla",
  "Eromba",
  "Ningol Chakouba",
  "Keibul Lamjao",
  "Singju",
  "Lai Haraoba",
  "Andro",
  "Moirang",
  "Ngari",
  "Cheiraoba",
  "Dzükou",
  "Phanek",
  "Sangai Festival",
  "Kangshoi",
  "Ukhrul",
  "Thang-ta",
];

/** Hero — rotating subject line. */
export const heroSubjects: string[] = [
  "the sangai's last forest",
  "a market run by 5,000 women",
  "a hill that blooms once a year",
  "a lake you can walk on",
];

/** Responsible travel — the short version. */
export const responsibleQuickAsks: QuickAsk[] = [
  { label: "Ask before you photograph", detail: "People, homes, rituals and children — every time." },
  { label: "Carry your plastic out", detail: "Bottles, wrappers, wet wipes. There is no collection on the ridge." },
  { label: "Buy from the maker", detail: "The weaver's own price, paid in full, beats any showroom discount." },
  { label: "Keep your distance", detail: "Inside Keibul Lamjao, stay on the marked routes and use a lens, not your feet." },
  { label: "Pay the guide properly", detail: "A day's guiding is a day's work. Do not bargain it down to a tip." },
  { label: "Check before you go", detail: "Permits, road status and advisories change. Verify with official sources." },
];

/** Responsible travel — the visitor's pledge. */
export const pledgeItems: string[] = [
  "I will ask before photographing a person, a home or a ritual — and accept no as an answer.",
  "I will carry my plastic back out with me, including on trek routes and boat trips.",
  "I will buy handloom, pottery and bamboo work from the person who made it, at their price.",
  "I will keep my distance from wildlife and stay on marked paths inside protected areas.",
  "I will pay guides, drivers and hosts fairly rather than bargaining them down.",
  "I will check permits and current advisories with official sources before I travel.",
];

