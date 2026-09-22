import { Badge } from "@/components/ui/badge";

interface Dish {
  name: string;
  meitei: string;
  blurb: string;
  note: string;
}

/**
 * Editorial primer. Facts kept deliberately plain: what the dish is, what is
 * actually in it, and how it is eaten.
 */
const DISHES: Dish[] = [
  {
    name: "Eromba",
    meitei: "ꯏꯔꯣꯝꯕ",
    blurb:
      "Boiled vegetables — potato, beans, seasonal greens — mashed together with ngari and roasted chillies, then finished with maroi napakpi (Chinese chives) or coriander.",
    note: "The everyday centre of a Meitei meal. Heat varies wildly; ask before you commit.",
  },
  {
    name: "Singju",
    meitei: "ꯁꯤꯡꯖꯨ",
    blurb:
      "A raw salad tossed to order: shredded cabbage, banana flower, lotus stem or raw papaya bound with roasted perilla or sesame powder, gram flour, chilli and usually ngari.",
    note: "Sold from roadside singju stalls through the afternoon — Manipur's great street snack.",
  },
  {
    name: "Chak-hao kheer",
    meitei: "ꯆꯥꯛꯍꯥꯎ",
    blurb:
      "Chak-hao, Manipur's aromatic black rice, simmered slowly with milk, sugar and cardamom until it turns deep purple and nutty.",
    note: "Chak-hao carries a GI tag for Manipur. Served at weddings and feasts.",
  },
  {
    name: "Ngari",
    meitei: "ꯉꯥꯔꯤ",
    blurb:
      "Small sun-dried fish packed into earthen pots and fermented for months. It is a seasoning, not a side — the base note under eromba, singju and morok metpa.",
    note: "Pungent by design. If you avoid fish, say so clearly; ngari hides in most dishes.",
  },
  {
    name: "Morok metpa",
    meitei: "ꯃꯣꯔꯣꯛ ꯃꯦꯠꯄ",
    blurb:
      "Green chillies roasted or steamed, then pounded with ngari, a little oil and salt into a coarse, fiery chutney.",
    note: "Taken in small dabs with rice. Genuinely hot — the local u-morok chilli is no joke.",
  },
  {
    name: "Kangshoi",
    meitei: "ꯀꯥꯡꯁꯣꯢ",
    blurb:
      "A light, brothy stew of whatever vegetables are in season with ginger, onion, chilli and a little ngari or dried fish. Barely any oil.",
    note: "Home food. The dish most Manipuri families actually eat on a weekday.",
  },
  {
    name: "Paaknam",
    meitei: "ꯄꯥꯛꯅꯝ",
    blurb:
      "A savoury gram-flour cake mixed with herbs, lotus stem, ngari and chilli, wrapped in banana leaf and steamed or baked until set.",
    note: "Cut into wedges, eaten warm. Often part of a festive thali.",
  },
];

export function DishesToKnow() {
  return (
    <section
      aria-labelledby="dishes-heading"
      className="rounded-[var(--radius-lg)] border border-border bg-surface-sunken p-6 md:p-10"
    >
      <p className="eyebrow flex items-center gap-3 text-muted-foreground">
        <span className="weave-rule inline-block h-[3px] w-10 rounded-full" />
        Before you order
      </p>
      <h2 id="dishes-heading" className="font-display mt-4 text-3xl md:text-4xl">
        Dishes to know
      </h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
        Manipuri cooking is boiled, fermented and herb-led rather than heavy with oil or masala.
        Learn these seven and you can read almost any menu in the state.
      </p>

      <ul className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {DISHES.map((dish) => (
          <li
            key={dish.name}
            className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-surface p-5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-xl">{dish.name}</h3>
              <span lang="mni-Mtei" className="font-mayek text-sm text-muted-foreground">
                {dish.meitei}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{dish.blurb}</p>
            <Badge variant="primary" className="self-start whitespace-normal text-left">
              {dish.note}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
