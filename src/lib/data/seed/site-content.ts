/**
 * Editorial page content.
 *
 * Seed copy for the page blocks. `npm run db:seed` pushes all of it into
 * `site_sections`, and the data layer reads it back, so a wording fix is a
 * content change rather than a deploy.
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

/** Home: the opening statement. */
export const homeStatement =
  "Manipur sits in a bowl of blue hills on India's eastern edge. The valley floods into a lake, the lake grows islands, the islands carry forest, and the forest hides a deer that lives nowhere else on earth. Everything here is layered, and every layer is still lived in.";

/** About: the six programme themes. */
export const aboutThemes: NamedIconCard[] = [
  {
    icon: "Smartphone",
    name: "Smart & Digital Tourism",
    body: "One place to find a stay, a route, a meal and a guide, instead of five WhatsApp groups and a search engine that has never heard of your village.",
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

/** About: editorial principles. */
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
    body: "An open-source platform is only useful if other people can keep running it. The data layer, the content and the design tokens are separated so they can.",
  },
];

/** Host landing: why list here. */
export const hostWhy: IconCard[] = [
  {
    icon: "BadgeCheck",
    title: "Free, with no commission",
    body: "Discover Manipur charges hosts nothing and takes no cut. No money passes through the platform: what a guest pays is between you and the guest.",
  },
  {
    icon: "CalendarRange",
    title: "You keep control",
    body: "Your rate, your house rules, your guests. The listing carries your family's name and story, not a brand laid over it.",
  },
  {
    icon: "Megaphone",
    title: "Manipur, told properly",
    body: "Guests arrive already knowing what eromba is, why the phumdi float and that Ukhrul is four hours away. Fewer surprises for them, fewer arguments for you.",
  },
];

/** Host landing: what the platform does, and what is still planned. */
export const hostWeHandle: IconCard[] = [
  {
    icon: "Camera",
    title: "A listing page that explains the place",
    body: "When hosting opens, your story and your own photographs get a page written with the same care as the rest of the site, in Meiteilon, Hindi or English. There is no photographer visit.",
  },
  {
    icon: "ShieldCheck",
    title: "Honest verification labels",
    body: "Every listing shows how well it has been checked, from official records to a single source, so guests know what is confirmed. Guest ID checks are not in place.",
  },
  {
    icon: "Languages",
    title: "Translation, planned",
    body: "Translating listings and guest messages into your language is on the roadmap but not built yet. Ask on the community Discord if you want help with wording.",
  },
  {
    icon: "LifeBuoy",
    title: "No payments to chase",
    body: "We take no payment and hold no money, so there is no payout to wait for. Questions and problems go to the community Discord.",
  },
];

/** Host landing: gallery strip. */
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

/** Host landing: how it works, in four steps. */
export const hostSteps: IconCard[] = [
  {
    icon: "ClipboardList",
    title: "Tell us what you have",
    body: "Fifteen minutes, four short steps. A room, a kitchen table, a loom, a route you have walked since childhood: that is enough to start. Sign in, fill it in, and our admins review it. Your draft is saved in this browser as you go.",
  },
  {
    icon: "Handshake",
    title: "Join the community",
    body: "Hosting is being planned in the open on the community Discord (https://discord.gg/hgGfm6UpU). That is where you will hear first when applications start being reviewed, and how.",
  },
  {
    icon: "CalendarCheck",
    title: "You set the rules",
    body: "Your price, your dates, your house rules. Block the days of a family shraddha or Yaoshang whenever you need to.",
  },
  {
    icon: "Wallet",
    title: "Free, and it stays between you and the guest",
    body: "Discover Manipur charges no fee and keeps no commission. Any payment is agreed between you and your guest directly.",
  },
];

/** Host landing: questions hosts actually ask. */
export const hostFaqs: QaItem[] = [
  {
    q: "Do I need a registered guest house or a licence?",
    a: "Not to apply. What you need before taking paying guests depends on your municipality or village council, and the state's Directorate of Tourism registers homestays. Check with them directly: Discover Manipur does not issue or check licences.",
  },
  {
    q: "What does Discover Manipur actually take?",
    a: "Nothing. There is no commission, no listing fee and no photography fee, and no money passes through the platform. If that ever changes, it will be announced publicly well before it applies to anyone.",
  },
  {
    q: "I do not speak much English. Can I still host?",
    a: "Yes. Your listing can be written in Meiteilon or Hindi. Translating listings and guest messages is planned but not built yet; until then, ask on the community Discord if you want help with wording.",
  },
  {
    q: "What if a guest damages something?",
    a: "Discover Manipur takes no payments, so it cannot hold a deposit or make a guest pay for repairs. Agree a deposit and house rules with your guest directly. If a guest behaves badly, report it on the community Discord.",
  },
  {
    q: "Can I block dates for family or festival days?",
    a: "Always. Your calendar is yours. Block Yaoshang, Ningol Chakouba, a shraddha or a wedding whenever you need to.",
  },
  {
    q: "How long does approval take?",
    a: "There is no fixed timeline: applications are reviewed by volunteer admins, and you can check yours on the application page at any time. If something is missing, the reviewer's note tells you what to fix before you apply again. Questions are welcome on the community Discord.",
  },
  {
    q: "Do I have to serve food?",
    a: "No. Many hosts offer only a room, some offer only a meal, and some only a walk. You list what you actually want to do and price it yourself.",
  },
  {
    q: "When do I get paid?",
    a: "Directly by your guest, on terms you agree together. Discover Manipur takes no payment and keeps nothing, so there is no payout schedule.",
  },
];

/** Contact: where each kind of message goes. */
export const contactChannels: Channel[] = [
  {
    icon: "Megaphone",
    label: "Community Discord",
    value: "https://discord.gg/hgGfm6UpU",
    detail: "Trip questions, hosting, contributing, or just saying hello. The quickest way to reach the volunteers who run the site.",
  },
  {
    icon: "ClipboardList",
    label: "Corrections and bugs",
    value: "https://github.com/Lanthoiba2022/discovermanipur/issues",
    detail: "A wrong fact, a broken page or an idea. Issues are public, so leave out phone numbers and other personal details.",
  },
  {
    icon: "ShieldAlert",
    label: "Accessibility",
    value: "Discord or a GitHub issue",
    detail: "Something on the site you cannot use? Say it is about accessibility so it is looked at first.",
  },
  {
    icon: "MapPin",
    label: "Where we are",
    value: "Imphal, Manipur (volunteers, working remotely)",
    detail: "No public office, so we have not invented a street address.",
  },
];

/** Home: the four counted facts. */
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
    note: "Keibul Lamjao is the world's only floating national park, and the last wild home of the sangai.",
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

/** Home: scrolling word strip. */
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

/** Hero: rotating subject line. */
export const heroSubjects: string[] = [
  "the sangai's last forest",
  "a market run by 5,000 women",
  "a hill that blooms once a year",
  "a lake you can walk on",
];

/** Responsible travel: the short version. */
export const responsibleQuickAsks: QuickAsk[] = [
  { label: "Ask before you photograph", detail: "People, homes, rituals and children. Every time." },
  { label: "Carry your plastic out", detail: "Bottles, wrappers, wet wipes. There is no collection on the ridge." },
  { label: "Buy from the maker", detail: "The weaver's own price, paid in full, beats any showroom discount." },
  { label: "Keep your distance", detail: "Inside Keibul Lamjao, stay on the marked routes and use a lens, not your feet." },
  { label: "Pay the guide properly", detail: "A day's guiding is a day's work. Do not bargain it down to a tip." },
  { label: "Check before you go", detail: "Permits, road status and advisories change. Verify with official sources." },
];

/** Responsible travel: the visitor's pledge. */
export const pledgeItems: string[] = [
  "I will ask before photographing a person, a home or a ritual, and accept no as an answer.",
  "I will carry my plastic back out with me, including on trek routes and boat trips.",
  "I will buy handloom, pottery and bamboo work from the person who made it, at their price.",
  "I will keep my distance from wildlife and stay on marked paths inside protected areas.",
  "I will pay guides, drivers and hosts fairly rather than bargaining them down.",
  "I will check permits and current advisories with official sources before I travel.",
];

