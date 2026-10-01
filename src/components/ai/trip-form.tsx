"use client";

import { Wand2 } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { budgetLevels, groupTypes, paces, type BudgetLevel, type GroupType, type Pace } from "@/lib/ai/schema";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const INTERESTS = [
  "Lakes & wetlands",
  "Hills & treks",
  "Heritage & history",
  "Food",
  "Handloom & craft",
  "Festivals",
  "Wildlife",
  "Markets",
  "Music & dance",
  "Slow & quiet",
] as const;

const budgetLabel: Record<BudgetLevel, string> = {
  budget: "Backpacker",
  comfortable: "Comfortable",
  premium: "Splurge",
};

const paceLabel: Record<Pace, string> = {
  relaxed: "Relaxed",
  balanced: "Balanced",
  packed: "Packed",
};

const groupLabel: Record<GroupType, string> = {
  solo: "Solo",
  couple: "Couple",
  family: "Family",
  friends: "Friends",
  group: "Big group",
};

const selectClasses =
  "h-11 w-full rounded-[var(--radius)] border border-border bg-surface px-3.5 text-sm text-foreground " +
  "focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring";

function Chip({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="eyebrow block text-[10px] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

export interface TripBrief {
  days: number;
  travelMonth: string;
  budget: BudgetLevel;
  pace: Pace;
  groupType: GroupType;
  interests: string[];
  accessibilityNeeds: string;
}

/** Turns the brief into the opening message of the conversation. */
export function briefToPrompt(brief: TripBrief): string {
  const bits = [
    `I have ${brief.days} ${brief.days === 1 ? "day" : "days"} in Manipur`,
    brief.travelMonth ? `in ${brief.travelMonth}` : "",
    `travelling as a ${groupLabel[brief.groupType].toLowerCase()}`,
    `on a ${budgetLabel[brief.budget].toLowerCase()} budget`,
    `at a ${brief.pace} pace`,
  ]
    .filter(Boolean)
    .join(", ");

  const lines = [`${bits}.`];
  if (brief.interests.length) lines.push(`I'm most interested in ${brief.interests.join(", ").toLowerCase()}.`);
  if (brief.accessibilityNeeds.trim()) lines.push(`Accessibility: ${brief.accessibilityNeeds.trim()}.`);
  lines.push("Build me a day-by-day plan from real listings on Discover Manipur, and tell me anything I should know before I go.");

  return lines.join(" ");
}

export function TripForm({
  onSubmit,
  className,
}: {
  onSubmit: (brief: TripBrief, prompt: string) => void;
  className?: string;
}) {
  const ids = {
    days: useId(),
    month: useId(),
    group: useId(),
    access: useId(),
  };

  const [days, setDays] = useState(4);
  const [travelMonth, setTravelMonth] = useState<string>("");
  const [budget, setBudget] = useState<BudgetLevel>("comfortable");
  const [pace, setPace] = useState<Pace>("balanced");
  const [groupType, setGroupType] = useState<GroupType>("couple");
  const [interests, setInterests] = useState<string[]>([]);
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("");

  function toggleInterest(value: string) {
    setInterests((prev) => (prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]));
  }

  return (
    <form
      className={cn("space-y-6", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const brief: TripBrief = { days, travelMonth, budget, pace, groupType, interests, accessibilityNeeds };
        onSubmit(brief, briefToPrompt(brief));
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Trip length" htmlFor={ids.days}>
          <select
            id={ids.days}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className={selectClasses}
          >
            {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "day" : "days"}
              </option>
            ))}
          </select>
        </Field>

        <Field label="When" htmlFor={ids.month}>
          <select
            id={ids.month}
            value={travelMonth}
            onChange={(e) => setTravelMonth(e.target.value)}
            className={selectClasses}
          >
            <option value="">Not sure yet</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset className="space-y-2">
        <legend className="eyebrow mb-2 text-[10px] text-muted-foreground">Budget</legend>
        <div className="flex flex-wrap gap-2">
          {budgetLevels.map((b) => (
            <Chip key={b} selected={budget === b} onClick={() => setBudget(b)}>
              {budgetLabel[b]}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="eyebrow mb-2 text-[10px] text-muted-foreground">Pace</legend>
        <div className="flex flex-wrap gap-2">
          {paces.map((p) => (
            <Chip key={p} selected={pace === p} onClick={() => setPace(p)}>
              {paceLabel[p]}
            </Chip>
          ))}
        </div>
      </fieldset>

      <Field label="Who's going" htmlFor={ids.group}>
        <select
          id={ids.group}
          value={groupType}
          onChange={(e) => setGroupType(e.target.value as GroupType)}
          className={selectClasses}
        >
          {groupTypes.map((g) => (
            <option key={g} value={g}>
              {groupLabel[g]}
            </option>
          ))}
        </select>
      </Field>

      <fieldset className="space-y-2">
        <legend className="eyebrow mb-2 text-[10px] text-muted-foreground">
          What pulls you here <span className="normal-case tracking-normal">(pick any)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <Chip key={i} selected={interests.includes(i)} onClick={() => toggleInterest(i)}>
              {i}
            </Chip>
          ))}
        </div>
      </fieldset>

      <Field label="Access needs (optional)" htmlFor={ids.access}>
        <input
          id={ids.access}
          type="text"
          value={accessibilityNeeds}
          onChange={(e) => setAccessibilityNeeds(e.target.value)}
          placeholder="Step-free routes, short walks, no early starts…"
          className={cn(selectClasses, "placeholder:text-muted-foreground")}
        />
      </Field>

      <Button type="submit" size="lg" className="w-full">
        <Wand2 aria-hidden className="size-4" />
        Start planning
      </Button>
    </form>
  );
}
