export interface FaqItem {
  q: string;
  /** Plain text, also used for the FAQPage JSON-LD, so keep it prose. */
  a: string;
}

export interface FaqGroup {
  id: string;
  label: string;
  blurb: string;
  items: FaqItem[];
}

export const faqGroups: FaqGroup[] = [
  {
    id: "planning",
    label: "Planning & permits",
    blurb: "Entry rules, paperwork and how far ahead to plan.",
    items: [
      {
        q: "Do I need an Inner Line Permit to visit Manipur?",
        a: "If you are an Indian citizen who is not a resident of the state, you will generally need an Inner Line Permit (ILP) to enter Manipur. Permits are typically issued online or on arrival at designated counters, come in short-stay and longer categories, and ask for photo ID and your itinerary. Categories, fees and validity have changed more than once, so confirm the current rules with the Government of Manipur before you book anything.",
      },
      {
        q: "What applies to foreign nationals?",
        a: "Manipur sits within the Protected Area regime that applies to parts of the North East, and the requirement for foreign nationals to hold a Protected Area Permit has been relaxed and then reinstated at different times. Nationals of a few countries face additional restrictions regardless of the general rule. Because this changes with government notifications rather than seasons, check the Ministry of Home Affairs and the Indian mission in your country, and ask your host to confirm what they are currently seeing from visitors.",
      },
      {
        q: "Where should I verify all of this?",
        a: "Use official sources: the Government of Manipur and Manipur Tourism for permits and local notifications, the Ministry of Home Affairs for Protected Area rules, and your own government's travel advisory for the security picture. Discover Manipur is a volunteer-run community platform and does not have a live feed of any of these, so we point you at the source rather than printing a number that may be out of date.",
      },
      {
        q: "Is it safe to travel in Manipur right now?",
        a: "Conditions vary by district and by period. Parts of the state have been affected by conflict and displacement in recent years, and curfews, road closures or internet restrictions have been imposed at times. Read a current advisory, ask your host about conditions in the week before you travel, keep your itinerary flexible, and take insurance that genuinely covers the region.",
      },
      {
        q: "How far ahead should I plan?",
        a: "Two to four weeks is comfortable for most trips. Plan further ahead if you want to be there for a major festival, if you are travelling in the Sangai Festival period in late November, or if you need a specific homestay: small family-run stays have very few rooms and fill early.",
      },
      {
        q: "What should I pack?",
        a: "Layers, because the valley and the hills are not the same climate; a rain shell from roughly May to September; proper shoes if you intend to walk anywhere; a refillable bottle and a filter; a dry bag for your own rubbish; and modest clothing for temples, churches and village visits. A power bank is sensible, as supply can be patchy outside Imphal.",
      },
    ],
  },
  {
    id: "getting-there",
    label: "Getting there & around",
    blurb: "Flights, roads and what moves between towns.",
    items: [
      {
        q: "How do I reach Manipur?",
        a: "The usual route is to fly into Imphal, which has domestic connections to Delhi, Kolkata, Guwahati and other Indian cities, usually with a change. Overland, the National Highway from Dimapur in Nagaland and the route from Silchar in Assam are the main road approaches, both mountainous and slow in the rain. There is a railhead at Jiribam on the Assam border.",
      },
      {
        q: "How do I get around once I am there?",
        a: "Shared Sumos and tempos run the intercity routes and are cheap and local; private cabs and SUVs with drivers are the practical choice for a day of sightseeing or for the hill districts; autos and local buses cover Imphal itself. Self-drive rental is limited, and a hired car with a driver who knows the roads is usually the better decision.",
      },
      {
        q: "How long does it take to get anywhere?",
        a: "Assume road times are longer than the distance suggests. Most of the valley destinations are within an hour or two of Imphal; the hill districts can take half a day. Landslides in the monsoon can close a route for hours or longer, so do not schedule an onward flight for the same evening you come down from a hill.",
      },
      {
        q: "Is it better to hire a driver or self-drive?",
        a: "Hire a driver. Road conditions, weather, checkpoints and local knowledge all favour someone who works the route regularly, and it keeps the money in the local economy. Agree the route, the daily rate and who pays for fuel and parking before you set off.",
      },
    ],
  },
  {
    id: "stays",
    label: "Stays & booking",
    blurb: "How homestays work here, and what booking on Discover Manipur means.",
    items: [
      {
        q: "What is a Manipuri homestay actually like?",
        a: "Usually a family home with one to three guest rooms, home-cooked meals eaten with the household, and hosts who will happily reorganise your itinerary over breakfast. Expect warmth and local knowledge rather than hotel service: hot water may be by bucket, the wifi may be slow, and the day tends to start early.",
      },
      {
        q: "Can I book through Discover Manipur?",
        a: "You can send a booking request for a homestay or experience. Signed in, it is saved with your account, where our admins and the listing's host can see it. It is still only a request: no payment is taken, the property is not notified automatically and no reservation is created. Nothing generated here is a contract. Contact the host directly to confirm.",
      },
      {
        q: "Are listings verified?",
        a: "No. Places are researched by volunteers from public sources, but some stay, food, experience and transport listings are still sample entries that show how the platform works and do not describe a real business. We do not inspect properties, hold commercial partnerships or take a commission, and we say so rather than implying a verification process we do not run.",
      },
      {
        q: "What house rules should I expect?",
        a: "Shoes off indoors in most homes, a quiet hour at night, and asking before you bring guests, alcohol or a drone onto the property. Some districts and some households are dry. Ask about meal times when you arrive; a family cooking for you is planning around your answer.",
      },
      {
        q: "Should I bring cash?",
        a: "Yes. UPI works widely in Imphal and in larger towns, but carry cash for homestays, village markets, shared transport and anywhere in the hills. ATMs thin out quickly outside the valley and can be out of service.",
      },
    ],
  },
  {
    id: "food",
    label: "Food",
    blurb: "What to eat, and how to eat it well.",
    items: [
      {
        q: "What should I eat first?",
        a: "Eromba (boiled vegetables mashed with chilli and fermented fish) and singju, a sharp salad of shredded vegetables with roasted chickpea flour and chilli. Chak-hao, the local black rice, appears as a dessert kheer and as a deep purple plain rice. Add a chamthong vegetable stew and you have a fair introduction to a Manipuri thali.",
      },
      {
        q: "Is the food very spicy?",
        a: "Often, yes, and the heat is usually fresh chilli rather than a long-cooked masala. Say so before ordering; most kitchens will adjust. Fermented fish, ngari, is the defining flavour of many dishes and is pungent in a way that is worth trying at least once.",
      },
      {
        q: "Can I eat well as a vegetarian or vegan?",
        a: "Vegetarian food is easy to find, but be aware that many apparently vegetable dishes are seasoned with ngari or dried fish. Ask specifically. Vegans should flag it in advance: a homestay given notice will cook around it happily, whereas a restaurant mid-service may not.",
      },
      {
        q: "Where do locals actually eat?",
        a: "Small family-run kitchens and market stalls rather than hotel restaurants. In Imphal, the markets are the best food education you will get in a morning. If you are staying with a family, the best meal of your trip is likely to be at their table.",
      },
    ],
  },
  {
    id: "festivals",
    label: "Festivals & timing",
    blurb: "When to come, and what is happening when you do.",
    items: [
      {
        q: "When is the best time to visit?",
        a: "October to March is the most comfortable window: clear air, cool days and the main festival season. The monsoon from roughly June to September is intensely green and much quieter, but expect heavy rain and the occasional landslide-blocked road. Late spring around May and June brings the Shirui lily into flower in Ukhrul.",
      },
      {
        q: "What is the Sangai Festival?",
        a: "The state's flagship tourism festival, usually held over about ten days in late November, named after Manipur's endemic brow-antlered deer. It gathers crafts, handloom, indigenous sport, food and performance from across the districts in one place. Book accommodation well ahead if you are coming for it, as the city is full.",
      },
      {
        q: "Which other festivals are worth planning around?",
        a: "Yaoshang in spring, a several-day festival with thabal chongba dancing in the evenings; Cheiraoba, the Meitei new year, when households climb a nearby hill; Ningol Chakkouba in autumn, when daughters return to their parents' homes for a feast; Lai Haraoba through the warmer months; and the harvest festivals of the hill communities, including Gaan-Ngai and Kut. Dates follow lunar and local calendars, so confirm each year.",
      },
      {
        q: "Can visitors attend religious festivals?",
        a: "Often yes, and hospitality is generous, but attendance is not the same as access. Some rituals are closed, photography is frequently restricted even in a crowd, and dress expectations are real. Go with a local host who can tell you where to stand, and follow their lead on cameras.",
      },
    ],
  },
  {
    id: "accessibility",
    label: "Accessibility",
    blurb: "What is realistic, and what we tell you about it.",
    items: [
      {
        q: "How accessible is Manipur for wheelchair users?",
        a: "Honestly, mixed. Museums, memorials and some parks in Imphal are manageable; footpaths are uneven, kerb ramps are inconsistent, and most hill viewpoints, village homes and boat jetties are not step-free. Travelling with a companion and a hired vehicle makes a great deal more possible than public transport does.",
      },
      {
        q: "Does Discover Manipur tell me which places are accessible?",
        a: "Each place listing carries a wheelchair-accessible flag and a written note, because a yes or no on its own is misleading. The note is where we describe the gravel, the three steps at the entrance or the absence of an accessible toilet. Where we do not know, we say we do not know.",
      },
      {
        q: "Is the website itself accessible?",
        a: "We build to WCAG 2.1 AA: keyboard operability throughout, visible focus indicators, semantic landmarks, descriptive alt text and a reduced-motion path for every animation. Our accessibility statement lists what is supported, the limitations we know about, and how to report anything we have missed.",
      },
      {
        q: "Do you have anything in Meiteilon?",
        a: "Partly. Meetei Mayek script appears alongside English for names and key terms, and multilingual support is one of the themes this project is built against. Full translation of the site is not done, and we would rather say that than claim it.",
      },
    ],
  },
  {
    id: "hosting",
    label: "Hosting",
    blurb: "For families, guides and cooks thinking about listing.",
    items: [
      {
        q: "Can I list my homestay or experience?",
        a: "Yes. Sign in and fill in the host application. It is saved with your account and reviewed by our admins, and you can check its status on the application page. Once approved, your account can use the host dashboard. Listing is free and there is no commission. Photos are not uploaded yet, so keep yours ready; questions are welcome on the community Discord.",
      },
      {
        q: "What would you expect from a host?",
        a: "Accurate descriptions and photographs of the actual property, clear pricing with nothing hidden until arrival, a stated cancellation policy, and guest safety taken seriously. For experiences: a real group-size cap, the languages you can host in, and what is genuinely included.",
      },
      {
        q: "Would you take a commission?",
        a: "No. No money moves through Discover Manipur, so there is nothing to take a commission on. If that ever changed, the terms would be published in full before anyone was asked to list.",
      },
      {
        q: "I run a guiding or transport business. Can I be listed?",
        a: "Same answer: the data model supports guides, drivers and transport operators, and we would like to hear from you, but nobody is being onboarded yet. Tell us what you do on the community Discord.",
      },
    ],
  },
];

export const allFaqItems: FaqItem[] = faqGroups.flatMap((g) => g.items);
