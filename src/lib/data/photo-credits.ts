/**
 * Photographs sourced from Wikimedia Commons.
 *
 * Every entry here is used under a licence that permits reuse, and every one
 * carries its photographer and licence so the credit can be rendered on the
 * site — CC BY and CC BY-SA both require attribution. Each file was resized
 * for the web and converted to WebP; nothing else about the image is changed.
 *
 * The rest of the photography in `public/file-uploads/` is the project's own.
 * Do NOT add an image here without opening it first: Commons files are often
 * filed under a subject they do not actually depict.
 */
export interface PhotoCredit {
  /** Filename inside `public/file-uploads/`. */
  file: string;
  /** What the photograph shows, used as the default alt text. */
  alt: string;
  subject: string;
  author: string;
  licence: string;
  /** The Commons file page. */
  source: string;
}

export const PHOTO_CREDITS: PhotoCredit[] = [
  {
    file: "sangai-pair-keibul.webp",
    alt: "A pair of sangai, the brow-antlered deer, standing in grassland at Keibul Lamjao.",
    subject: "Sangai, the brow-antlered deer of Manipur",
    author: "Dr. Raju Kasambe",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File%3ASangai_Brow-antlered_Deer_Rucervus_eldii_eldii_Manipur_by_Dr._Raju_Kasambe_%281%29.jpg",
  },
  {
    file: "manipuri-dancer-solo.webp",
    alt: "A Manipuri classical dancer mid-gesture in orange costume against a black stage.",
    subject: "Manipuri classical dance",
    author: "Sudip kumar ghosh(classical manipuri dancer)",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File%3AClassical_Manipuri_Dancer_Sudip_Kumar_Ghosh.jpg",
  },
  {
    file: "manipuri-raas-group.webp",
    alt: "A Manipuri Raas troupe in embroidered kumil skirts and conical veils, seated in a row.",
    subject: "Manipuri classical dance",
    author: "Shoot stufz",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File%3AManipuri_dancers_at_Khajuraho_Dance_Festival_2026_%2802%29.jpg",
  },
  {
    file: "dzukou-lily-valley.webp",
    alt: "A pink lily in flower above the grass of Dzukou Valley, with mist lying on the ridge behind.",
    subject: "Dzukou Valley",
    author: "Ganesh Mohan T",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File%3ADzukou_Lily_01.jpg",
  },
  {
    file: "senapati-green-hills.webp",
    alt: "Rolling green hills in Senapati district under a heavy grey sky.",
    subject: "Senapati district",
    author: "Samudra bikash hazarika",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File%3ABreathtaking_beauty_of_Dzukou_Valley_in_Manipur-Nagaland_border.jpg",
  },
  {
    file: "senapati-ridgeline.webp",
    alt: "A ridgeline of deep green hills folding away into cloud in Senapati district.",
    subject: "Senapati district",
    author: "Original: Samudra Bikash Hazarika Derivative work: UnpetitproleX",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File%3ABreathtaking_beauty_of_Dzukou_Valley_in_Manipur-Nagaland_border_%28edit%29.jpg",
  },
  {
    file: "senapati-open-hills.webp",
    alt: "Bare trees standing against open green hill country in Senapati district.",
    subject: "Senapati district",
    author: "Samudra bikash hazarika",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File%3AAstonishing_beauty_of_the_Dzuko_Valley_in_Manipur-Nagaland_border.jpg",
  },
  {
    file: "terraced-valley-dusk.webp",
    alt: "A terraced valley in the Manipur hills at dusk, paddy steps cut into the slope.",
    subject: "A hill village in Manipur",
    author: "HuishuVillage",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File%3AHuishu_Kaphung.jpg",
  },
  {
    file: "hill-village-valley.webp",
    alt: "A hill village spread across a wooded valley floor in Manipur under a bright sky.",
    subject: "A hill village in Manipur",
    author: "RakpaThangal",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File%3ATagaramphungView.jpg",
  },
  {
    file: "hill-pond-smoke.webp",
    alt: "A pond and a thread of woodsmoke among the trees of a Manipur hill settlement.",
    subject: "A hill village in Manipur",
    author: "Ng ngalengshim",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File%3AKoirer_Nyi_%28PYO_natural_lake_and_Fishery%29.jpg",
  },
  {
    file: "loktak-phumdi-hut.webp",
    alt: "A fisherman's hut standing on a phumdi island among the open water of Loktak Lake.",
    subject: "Loktak Lake",
    author: "Sharada Prasad CS",
    licence: "CC BY 2.0",
    source: "https://commons.wikimedia.org/wiki/File%3AA_home_on_Loktak_Lake_Moirang_Manipur_India.jpg",
  },
  {
    file: "manipuri-food-leaf.webp",
    alt: "Manipuri food served on a banana leaf — fried cakes and dried fish.",
    subject: "Manipuri cuisine",
    author: "Vsigamany",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File%3APaknam.JPG",
  },
  {
    file: "manipuri-curry-bowl.webp",
    alt: "A bowl of Manipuri meat curry served with a spoon.",
    subject: "Manipuri cuisine",
    author: "Real Sovan",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File%3AVoksa_Meh_%28Manipuri%29.JPG",
  },
  {
    file: "manipur-chillies.webp",
    alt: "A heap of fresh red and green chillies from a Manipur hill market.",
    subject: "Ukhrul district",
    author: "shankar s. from Poona (pune), India, India",
    licence: "CC BY 2.0",
    source: "https://commons.wikimedia.org/wiki/File%3ABhoot_Jholokia_or_Naga_Giant_Chilly_peppers-_positively_lethal%21_%2850016211336%29.jpg",
  },
  {
    file: "kangla-kanglasha.webp",
    alt: "The white kanglasha — dragon-lion guardians — flanking the approach inside Kangla Fort, Imphal.",
    subject: "Kangla Fort, Imphal",
    author: "Haoreima",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File%3AA_colossal_pair_of_classical_statues_dedicated_to_Kanglasha%2C_the_ancient_Meitei_dragon_lion_deity%2C_standing_inside_the_Kangla_Fort_in_Imphal.jpg",
  },
  {
    file: "manipur-temple-front.webp",
    alt: "The arched frontage of a temple in Manipur, visitors crossing the tiled forecourt.",
    subject: "A temple in Manipur",
    author: "kknila",
    licence: "CC BY-SA 2.0",
    source: "https://commons.wikimedia.org/wiki/File%3AShree_Govindaji_temple%2C_Manipur.jpg",
  },
  {
    file: "ukhrul-hill-haze.webp",
    alt: "Layered hills fading into blue haze above a village in Ukhrul district.",
    subject: "Ukhrul district",
    author: "shankar s. from Poona (pune), India, India",
    licence: "CC BY 2.0",
    source: "https://commons.wikimedia.org/wiki/File%3ADescending_was_a_breeze-_there_is_that_hilltop_village_again%21_%2850016358461%29.jpg",
  },
  {
    file: "manipur-butterfly.webp",
    alt: "A large swallowtail butterfly resting on wet rock in the Manipur hills.",
    subject: "Churachandpur district",
    author: "Thomas TK Tungnung",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File%3AThe_Great_Mormon%2C_Papilio_memnon%2C_Male%2C_seen_mud-puddling_in_a_ditch.jpg",
  },
];

/** Lookup by filename, for rendering a credit next to an image. */
export const creditFor = (file: string): PhotoCredit | undefined =>
  PHOTO_CREDITS.find((c) => c.file === file);
