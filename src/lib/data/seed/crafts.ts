import type { Craft } from "@/types";

/**
 * Crafts listed by Manipuri makers.
 *
 * Discover Manipur takes no payment and no commission — each listing carries the maker's
 * own contact details. Phone numbers and websites are deliberately placeholder
 * values until real artisans opt in; the shape is real so that swapping in a
 * verified maker is a data change, not a code change.
 */
export const crafts: Craft[] = [
  {
    id: "cr-phanek",
    slug: "moirang-phee-phanek",
    name: "Moirang Phee Phanek",
    meiteiName: "ꯃꯣꯏꯔꯥꯡ ꯐꯤ",
    description:
      "A handwoven wrap-around phanek carrying the Moirang Phee motif — the stepped temple-spire border that is among the most recognisable patterns in Manipuri handloom.",
    story:
      "The Moirang Phee border is woven from memory rather than a pattern card, counted thread by thread on a loin loom. A single phanek takes a weaver the better part of a fortnight. The motif is tied to Moirang, the old principality on the south-western edge of Loktak, and the design carries a GI tag.",
    category: "handloom",
    price: 1200,
    priceNote: "varies with border width and thread count",
    maker: "Binodini Devi",
    makerStory:
      "Weaves on a loin loom on her verandah in Moirang, as her mother and grandmother did. Takes commissions for specific border widths.",
    location: "Moirang",
    district: "Bishnupur",
    phone: "+91 98000 00001",
    images: [{ src: "/file-uploads/phanek.jpeg", alt: "A handwoven Manipuri phanek with a patterned border" }],
    materials: ["cotton", "silk thread"],
    madeToOrder: true,
    leadTimeDays: 14,
    giTagged: true,
    featured: true,
  },
  {
    id: "cr-pottery",
    slug: "andro-black-pottery",
    name: "Andro Black Pottery",
    description:
      "Cooking and serving pots shaped entirely without a wheel, then fired in an open pit until the clay turns its characteristic black.",
    story:
      "Andro potters build each vessel by hand — no wheel is used at all, which makes this one of the few surviving wheel-less pottery traditions in India. The clay is mixed with weathered serpentine rock, and the black finish comes from the firing rather than any glaze. Traditionally the craft is practised by the women of the village.",
    category: "pottery",
    price: 850,
    priceNote: "per set of three vessels",
    maker: "Andro Potters' Collective",
    makerStory:
      "A village collective in Andro that also runs hands-on workshops for visitors — see the Andro black pottery experience.",
    location: "Andro",
    district: "Imphal East",
    phone: "+91 98000 00002",
    images: [{ src: "/file-uploads/pottery.jpeg", alt: "Hand-built black pottery vessels from Andro village" }],
    materials: ["local clay", "weathered serpentine"],
    madeToOrder: false,
    giTagged: false,
    featured: true,
  },
  {
    id: "cr-bamboo",
    slug: "bamboo-basketry",
    name: "Bamboo Basketry",
    description:
      "Tightly woven bamboo baskets and winnowing trays, the everyday containers of a Manipuri kitchen, made to last decades rather than seasons.",
    story:
      "Bamboo is split, shaved and soaked before weaving, and the weave tightens as it dries. The same techniques produce fish traps, grain stores and the conical carrying baskets seen on hill paths.",
    category: "bamboo",
    price: 650,
    maker: "Green Bamboo Crafts",
    location: "Churachandpur",
    district: "Churachandpur",
    phone: "+91 98000 00003",
    images: [{ src: "/file-uploads/bamboocrafts.jpeg", alt: "Woven bamboo baskets with traditional Manipuri patterning" }],
    materials: ["bamboo", "cane"],
    madeToOrder: true,
    leadTimeDays: 7,
    giTagged: false,
    featured: false,
  },
  {
    id: "cr-shawl",
    slug: "manipuri-silk-shawl",
    name: "Manipuri Silk Shawl",
    description:
      "A light silk shawl with woven motif bands at either end — worn at Ningol Chakouba and given as a gift between families.",
    story:
      "Manipur rears its own silk, including the golden muga and the softer eri, and the shawl's weight is judged by how it falls rather than by any measure. The end-bands are the weaver's signature.",
    category: "handloom",
    price: 3500,
    maker: "Silk Route Manipur",
    location: "Imphal East",
    district: "Imphal East",
    phone: "+91 98000 00004",
    images: [{ src: "/file-uploads/shwal.jpeg", alt: "A white Manipuri shawl with an orange temple-point border and multicoloured floral embroidery" }],
    materials: ["mulberry silk", "eri silk"],
    madeToOrder: false,
    giTagged: false,
    featured: true,
  },
  {
    id: "cr-sinai",
    slug: "sinai-chei-ornament",
    name: "Sinai Chei",
    description:
      "A handcrafted ornament in the Manipuri idiom, made in small batches by a family workshop.",
    story:
      "Made to be worn with traditional dress at festivals and weddings, and increasingly commissioned as a keepsake by visitors.",
    category: "jewellery",
    price: 1800,
    maker: "Heritage Jewellery",
    location: "Moirang",
    district: "Bishnupur",
    phone: "+91 98000 00005",
    images: [{ src: "/file-uploads/manipuri-raas-group.webp", alt: "Manipuri dancers in full potloi costume, wearing the ornament work this craft belongs to" }],
    materials: ["brass", "thread"],
    madeToOrder: true,
    leadTimeDays: 10,
    giTagged: false,
    featured: false,
  },
  {
    id: "cr-sculpture",
    slug: "kanglei-sculpture",
    name: "Kanglei Sculpture",
    description:
      "Carved pieces drawing on Manipuri iconography — the kangla-sha, the polo rider, the sangai — made as table pieces.",
    story:
      "Sagol Kangjei, played at Mapal Kangjeibung in Imphal, is widely held to be the ancestor of modern polo, and the mounted player is a recurring subject for Manipuri carvers.",
    category: "sculpture",
    price: 2200,
    maker: "Kanglei Crafters",
    location: "Imphal West",
    district: "Imphal West",
    phone: "+91 98000 00006",
    images: [{ src: "/file-uploads/polo.jpeg", alt: "A carved sculpture of a Manipuri polo rider" }],
    materials: ["wood"],
    madeToOrder: true,
    leadTimeDays: 21,
    giTagged: false,
    featured: true,
  },
];
