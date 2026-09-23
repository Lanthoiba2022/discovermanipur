import type { Festival } from "@/types";

/**
 * Manipur Tourism festival seed data — 12 festivals across Manipur's communities.
 * Many follow lunar or agricultural calendars, so dates shift year to year.
 */
export const festivals: Festival[] = [
  {
    id: "fs-sangai-festival",
    slug: "sangai-festival",
    name: "Manipur Sangai Festival",
    description:
      "The state's flagship tourism festival, running for ten days each November across Hapta Kangjeibung in Imphal and satellite venues around the valley. Indigenous sports including Yubi Lakpi and Mukna, Thang-Ta demonstrations, classical Ras Leela and pung cholom, a vast handloom and handicraft bazar, an adventure sports wing and a food court that assembles every community's cooking in one place. It is named for the sangai, the state animal, and is by some distance the easiest week in the year to see everything Manipur does well.",
    month: "November",
    typicalDates: "21–30 November each year",
    location: "Hapta Kangjeibung and satellite venues, Imphal",
    district: "Imphal West",
    significance:
      "Manipur's principal cultural and tourism showcase, bringing valley and hill communities onto shared ground and driving the state's visitor season.",
    images: [
      { src: "/file-uploads/dance.jpg", alt: "Cultural performance at the Manipur Sangai Festival" },
      { src: "/file-uploads/manipuri-dancer-solo.webp", alt: "Classical Manipuri dance staged during the Sangai Festival" },
      { src: "/file-uploads/hotspotcar5.png", alt: "Festival crowds and pavilions in Imphal" },
    ],
    featured: true,
  },
  {
    id: "fs-yaoshang",
    slug: "yaoshang",
    name: "Yaoshang",
    meiteiName: "Yaoshang",
    description:
      "Manipur's five-day spring festival, beginning on the full moon of Lamta (February–March) with the burning of a thatched hut called the yaoshang mei thaba. Children go from house to house collecting nakatheng, colours are thrown as at Holi, and — the part that makes Yaoshang distinctive — every locality holds thabal chongba, a moonlight circle dance where young people hold hands and move in a ring to a live band until well past midnight.",
    month: "March",
    typicalDates: "Five days from the Lamta full moon, late February to mid-March",
    location: "Statewide, with thabal chongba in every Meitei locality",
    district: "Imphal West",
    significance:
      "The largest Meitei festival of the year, combining Vaishnavite Holi observance with the much older thabal chongba courtship dance.",
    images: [
      { src: "/file-uploads/manipuri-dancer-solo.webp", alt: "A Manipuri dancer mid-step, the form danced through Yaoshang nights" },
      { src: "/file-uploads/kha2.jpg", alt: "A crowded Imphal locality of the kind Yaoshang fills for five days" },
      { src: "/file-uploads/phanek.jpeg", alt: "Traditional dress worn during the Yaoshang festival" },
    ],
    featured: true,
  },
  {
    id: "fs-lai-haraoba",
    slug: "lai-haraoba",
    name: "Lai Haraoba",
    meiteiName: "Lai Haraoba",
    description:
      "The oldest surviving ritual performance in Manipur — literally the 'pleasing of the gods'. Over several nights in a village courtyard, maibi priestesses dance the entire Meitei creation story, from the making of the world through the building of a house and the weaving of cloth, accompanied by the pena fiddle. Different localities hold it at different times through spring and early summer; Moirang's is the most elaborate.",
    month: "April",
    typicalDates: "April to June, dates set separately by each locality",
    location: "Village courtyards across the valley; Moirang, Andro and Kanglatongbi are notable",
    district: "Bishnupur",
    significance:
      "The living core of pre-Vaishnavite Meitei religion, and the source from which much of Manipuri classical dance descends.",
    images: [
      { src: "/file-uploads/112.jpg", alt: "The temple gate precinct where a Lai Haraoba is held" },
      { src: "/file-uploads/manipuri-dancer-solo.webp", alt: "Ritual dress worn at Lai Haraoba" },
      { src: "/file-uploads/manipuri-dancer-solo.webp", alt: "Village courtyard set for a Lai Haraoba performance" },
    ],
    featured: true,
  },
  {
    id: "fs-ningol-chakouba",
    slug: "ningol-chakouba",
    name: "Ningol Chakouba",
    meiteiName: "Ningol Chakkouba",
    description:
      "The most affectionate day in the Meitei calendar: married daughters return to their parents' house for a feast laid on by their brothers, and go home with gifts. Held on the second day of the lunar month of Hiyangei, usually in November, it empties the roads of everything except women travelling home. Households cook for days beforehand, and the meal is the fullest chaak of the year.",
    month: "November",
    typicalDates: "Second lunar day of Hiyangei, usually early to mid-November",
    location: "Every Meitei household across Manipur",
    district: "Imphal East",
    significance:
      "Renews the bond between a married woman and her natal family, and is now observed by Manipuri communities worldwide.",
    images: [
      { src: "/file-uploads/herkit.jpg", alt: "A full Manipuri feast laid out on leaf plates for Ningol Chakouba" },
      { src: "/file-uploads/herkit.jpg", alt: "Traditional Manipuri meal served at a family gathering" },
      { src: "/file-uploads/phanek.jpeg", alt: "Handloom phaneks of the kind worn home for Ningol Chakouba" },
    ],
    featured: true,
  },
  {
    id: "fs-cheiraoba",
    slug: "cheiraoba",
    name: "Sajibu Cheiraoba",
    meiteiName: "Sajibu Nongma Panba Cheiraoba",
    description:
      "The Meitei new year, falling on the first lunar day of Sajibu in March or April. Houses are cleaned from top to bottom, a full meal is cooked and offered to the household deity, and in the afternoon families climb the nearest hill — Cheiraoba Ching Kaba — in the belief that rising higher lifts your fortunes for the year. Nongmaijing, Kaina and Langol fill with families all afternoon.",
    month: "April",
    typicalDates: "First lunar day of Sajibu, late March to mid-April",
    location: "Statewide; hill climbs at Nongmaijing, Langol, Kaina and Cheiraoching",
    district: "Imphal East",
    significance:
      "The Meitei new year, marking the agricultural year's start and combining household ritual with a collective hill climb.",
    images: [
      { src: "/file-uploads/marjing.png", alt: "Sunrise over the Imphal valley from a hilltop — Cheiraoba afternoon is spent climbing one" },
      { src: "/file-uploads/manipuri-curry-bowl.webp", alt: "A bowl of Manipuri curry from the new year meal cooked for Sajibu Cheiraoba" },
      { src: "/file-uploads/203.jpg", alt: "Valley view from a hill climbed at Cheiraoba" },
    ],
    featured: true,
  },
  {
    id: "fs-kut",
    slug: "kut",
    name: "Chavang Kut",
    description:
      "The autumn harvest festival of the Kuki-Zo, Chin and Mizo communities, celebrated on 1 November with dance, drums and the Kut Queen contest. Villages across Churachandpur, Kangpokpi and Chandel mark the close of the harvest with traditional dress, communal feasting and the Lom Lam dance; the main state celebration is held in Imphal and Churachandpur.",
    month: "November",
    typicalDates: "1 November each year",
    location: "Churachandpur, Kangpokpi, Chandel and Imphal",
    district: "Churachandpur",
    significance:
      "The principal harvest thanksgiving of Manipur's Kuki-Zo communities and a state public holiday.",
    images: [
      { src: "/file-uploads/kha2.jpg", alt: "Sacks of produce piled through an Imphal market at the end of the harvest Chavang Kut marks" },
      { src: "/file-uploads/manipuri-dancer-solo.webp", alt: "Traditional dance performed at the Kut festival" },
      { src: "/file-uploads/s73.avif", alt: "Hill community gathering during the harvest season" },
    ],
    featured: true,
  },
  {
    id: "fs-gaan-ngai",
    slug: "gaan-ngai",
    name: "Gaan-Ngai",
    description:
      "The greatest festival of the Zeliangrong people, held in December or January over five days to mark the end of the agricultural year. It opens with the ritual kindling of new fire by friction, and runs through the Khangchiu dormitory rites, the hoi shouting, folk songs, feasting and dances performed in full traditional dress. Tamenglong and Noney are the strongest places to see it.",
    month: "January",
    typicalDates: "Five days in late December or January, set by the Zeliangrong calendar",
    location: "Zeliangrong villages in Tamenglong, Noney and Imphal East",
    district: "Tamenglong",
    significance:
      "The Zeliangrong new year and the community's principal religious and social festival, recognised as a state holiday.",
    images: [
      { src: "/file-uploads/dance.jpg", alt: "Dancers in traditional dress at a Manipuri winter festival" },
      { src: "/file-uploads/senapati-ridgeline.webp", alt: "Winter hill country in western Manipur where Gaan-Ngai is kept" },
      { src: "/file-uploads/hill-village-valley.webp", alt: "Zeliangrong hill country where Gaan-Ngai is celebrated" },
    ],
    featured: false,
  },
  {
    id: "fs-shirui-lily-festival",
    slug: "shirui-lily-festival",
    name: "Shirui Lily Festival",
    description:
      "A four-day state festival held at Ukhrul each May to mark the blooming of Lilium mackliniae on the Shirui ridge and to build support for protecting it. Tangkhul cultural performances, a flower show, guided treks up the ridge, an adventure sports programme and a market of hill produce and crafts.",
    month: "May",
    typicalDates: "Four days in the second half of May",
    location: "Ukhrul town and Shirui village",
    district: "Ukhrul",
    significance:
      "Celebrates Manipur's endangered state flower and channels tourism revenue toward its conservation and toward Tangkhul village economies.",
    images: [
      { src: "/file-uploads/27.jpg", alt: "Shirui ridge during the lily bloom season" },
      { src: "/file-uploads/shiroi4.jpg", alt: "Hill country around Ukhrul at festival time" },
      { src: "/file-uploads/uhk.jpg", alt: "Ukhrul town, host of the Shirui Lily Festival" },
    ],
    featured: true,
  },
  {
    id: "fs-kwak-tanba",
    slug: "kwak-tanba",
    name: "Kwak Tanba",
    meiteiName: "Kwak Tanba",
    description:
      "Held on the tenth day of Durga Puja at Kangla, Kwak Tanba is the old royal ritual of 'chasing the crow' — a ceremonial procession in which a crow is released and its flight read as an omen for the coming year. The rite is performed in full traditional court dress and is one of the few surviving public royal ceremonies in Manipur.",
    month: "October",
    typicalDates: "Vijayadashami, the tenth day of Durga Puja, in October",
    location: "Kangla Fort, Imphal",
    district: "Imphal East",
    significance:
      "A surviving royal ritual linking the Meitei monarchy, Kangla and the annual reading of omens for the state's fortunes.",
    images: [
      { src: "/file-uploads/11.jpg", alt: "Kangla Fort, where Kwak Tanba is performed" },
      { src: "/file-uploads/112.jpg", alt: "Ceremonial grounds within Kangla" },
      { src: "/file-uploads/manipuri-raas-group.webp", alt: "Traditional court dress worn at Manipuri ceremonies" },
    ],
    featured: false,
  },
  {
    id: "fs-ras-leela",
    slug: "manipuri-ras-leela",
    name: "Manipuri Ras Leela",
    description:
      "The classical dance-drama of Krishna and the gopis, performed through the night in temple courtyards on the full moon nights of Kartik, Basanta and Kunja. Dancers wear the potloi, a stiff embroidered cylindrical skirt unique to Manipur, and the movement is unbroken and circular, without a sharp angle in it. The Govindajee temple in Imphal holds the most important performances.",
    month: "November",
    typicalDates: "Kartik Purnima in November, with further cycles in spring and autumn",
    location: "Shree Govindajee Temple and temple courtyards across the valley",
    district: "Imphal East",
    significance:
      "Manipur's contribution to India's classical dance canon, created under Maharaja Bhagyachandra in the 18th century and still performed as devotion rather than spectacle.",
    images: [
      { src: "/file-uploads/manipuri-raas-group.webp", alt: "Raas Leela dancers in the embroidered potloi and conical veil" },
      { src: "/file-uploads/12.jpg", alt: "Shree Govindajee Temple, principal venue for Ras Leela" },
      { src: "/file-uploads/phanek.jpeg", alt: "Folded lengths of Manipuri phanek cloth in magenta, lime, orange and purple, each edged with a woven temple-point border — the cloth tradition behind Manipuri dance costume" },
    ],
    featured: false,
  },
  {
    id: "fs-lui-ngai-ni",
    slug: "lui-ngai-ni",
    name: "Lui-Ngai-Ni",
    description:
      "The seed-sowing festival of the Naga tribes of Manipur, celebrated on 14–15 February and rotated between district headquarters each year. It marks the start of the agricultural season with the ceremonial sowing of the first seed, and brings together the state's Naga communities for dance, folk song and feasting in full traditional dress.",
    month: "February",
    typicalDates: "14–15 February each year",
    location: "Rotating host district — Ukhrul, Senapati, Tamenglong, Chandel or Kamjong",
    district: "Ukhrul",
    significance:
      "The common seed-sowing festival of Manipur's Naga tribes and their principal shared cultural occasion.",
    images: [
      { src: "/file-uploads/hill-village-valley.webp", alt: "Hill village country where Lui-Ngai-Ni marks the start of the sowing season" },
      { src: "/file-uploads/senapati-open-hills.webp", alt: "Naga hill country where Lui-Ngai-Ni is celebrated" },
      { src: "/file-uploads/manipuri-dancer-solo.webp", alt: "Traditional Naga dance performed at Lui-Ngai-Ni" },
    ],
    featured: false,
  },
  {
    id: "fs-khongjom-day",
    slug: "khongjom-day",
    name: "Khongjom Day",
    description:
      "Observed every 23 April at Kheba hill in Thoubal, marking the last battle of the Anglo-Manipuri War of 1891, where Major Paona Brajabashi and his men fought to the death. Wreaths are laid at the memorial, the Khongjom Parva ballad is sung, and the state observes a public holiday. It is the most solemn civic occasion in the Manipuri year.",
    month: "April",
    typicalDates: "23 April each year",
    location: "Khongjom War Memorial, Kheba Ching, Thoubal",
    district: "Thoubal",
    significance:
      "Commemorates Manipur's last stand against British annexation and is central to the state's sense of its own history.",
    images: [
      { src: "/file-uploads/18.jpg", alt: "Khongjom War Memorial on Kheba hill" },
      { src: "/file-uploads/182.jpg", alt: "Statue of Paona Brajabashi at Khongjom" },
      { src: "/file-uploads/183.jpg", alt: "Memorial grounds at Khongjom, Thoubal" },
    ],
    featured: false,
  },
];
